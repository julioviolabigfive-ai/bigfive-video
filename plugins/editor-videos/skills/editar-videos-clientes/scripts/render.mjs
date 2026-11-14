// Renderiza una o varias composiciones con UN solo empaquetado y entrega cada video con el audio normalizado
// (-16 LUFS si es horizontal: VSL/confirmación; -14 si es vertical: anuncios).
//
// Uso: node render.mjs "<proyecto>" "Comp=<salida.mp4>" ["Comp2=<salida2.mp4>" ...] [--unir "<VSL COMPLETO.mp4>"] [--borrador]
//   --unir      además une los videos en el orden dado (partes del VSL).
//   --borrador  media resolución, para revisar rápido (no entregar).
// Los renders se hacen de a uno: no correr en paralelo con transcribir.mjs ni con otro render.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {assertEngine, empaquetar, engineRequire, equipo, esErrorDeFotograma, ffmpegOk, mantenerTemporalesLimpios, normalizar, parseArgs, prepararVideos, RENDER_OPTS} from './lib.mjs';

assertEngine();
mantenerTemporalesLimpios();
const {pos, flags} = parseArgs(process.argv.slice(2));
const [proyectoArg, ...trabajos] = pos;
if (!proyectoArg || !trabajos.length || trabajos.some((t) => !t.includes('='))) {
  console.error('Uso: node render.mjs "<proyecto>" "Comp=<salida.mp4>" ["Comp2=<salida2.mp4>" ...] [--unir "<salida.mp4>"] [--borrador]');
  process.exit(1);
}
const proyecto = path.resolve(proyectoArg);
// Remotion busca su navegador desde la carpeta actual: el proyecto enlaza a los node_modules del motor, donde ya está.
process.chdir(proyecto);
const {selectComposition, renderMedia} = engineRequire()('@remotion/renderer');
// Videos de public/ con fotogramas clave muy espaciados (proyectos viejos): se recodifican antes de empaquetar.
prepararVideos(proyecto);
const serveUrl = await empaquetar(proyecto);
const tmpDir = path.join(proyecto, '..', 'render');
fs.mkdirSync(tmpDir, {recursive: true});

const salidas = [];
for (const t of trabajos) {
  const id = t.slice(0, t.indexOf('='));
  const salida = path.resolve(t.slice(t.indexOf('=') + 1));
  const composition = await selectComposition({serveUrl, id, inputProps: {}});
  const crudo = path.join(tmpDir, `${id}.mp4`);
  const t0 = Date.now();
  // Paralelo medido para esta PC (calibrar.mjs); sin medida, el de Remotion (mitad de los hilos). Cada fotograma en
  // paralelo es una pestaña de Chrome de ~0,5 GB: si ahora hay poca RAM libre (otros programas abiertos), se baja de
  // entrada para no llegar al error "No frame found at position".
  const hilos = os.availableParallelism?.() ?? os.cpus().length;
  const medido = equipo()?.concurrency ?? Math.max(1, Math.floor(hilos / 2));
  const libreGb = os.freemem() / 1024 ** 3;
  let concurrency = Math.min(medido, Math.max(2, Math.floor(libreGb / 0.6)));
  if (concurrency < medido) console.log(`${id}: ${libreGb.toFixed(1)} GB de RAM libre: ${concurrency} fotogramas en paralelo (esta PC rinde hasta ${medido}). Cerrar otros programas acelera el render.`);
  let cache = null;
  for (let intento = 1; ; intento++) {
    let ultimo = -10;
    try {
      await renderMedia({
        serveUrl, composition, outputLocation: crudo, inputProps: {}, ...RENDER_OPTS,
        scale: flags.borrador ? 0.5 : 1,
        concurrency,
        ...(cache ? {offthreadVideoCacheSizeInBytes: cache} : {}),
        onProgress: ({progress}) => {
          const p = Math.floor(progress * 100);
          if (p >= ultimo + 10) {
            ultimo = p - (p % 10);
            process.stdout.write(`${id}: ${ultimo}%\n`);
          }
        },
      });
      break;
    } catch (e) {
      // "No frame found at position": poca RAM libre para tantos fotogramas en paralelo. Se reintenta solo, con la
      // mitad de paralelo y una caché de video explícita (la mitad de la RAM libre, entre 1 y 3 GB).
      if (!esErrorDeFotograma(e) || intento >= 3) throw e;
      concurrency = Math.max(1, Math.floor(concurrency / 2));
      cache = Math.round(Math.min(3, Math.max(1, os.freemem() / 1024 ** 3 / 2)) * 1024 ** 3);
      console.log(`${id}: Remotion no consiguió un fotograma del video (poca memoria libre). Reintento ${intento + 1} de 3 con ${concurrency} en paralelo y caché de ${(cache / 1024 ** 3).toFixed(1)} GB.`);
    }
  }
  const seg = (Date.now() - t0) / 1000;
  const dur = composition.durationInFrames / composition.fps;
  const lufs = composition.height > composition.width ? -14 : -16;
  normalizar(crudo, salida, lufs);
  fs.rmSync(crudo, {force: true});
  console.log(`listo: ${salida} (${dur.toFixed(1)} s de video en ${seg.toFixed(0)} s, ${lufs} LUFS)`);
  salidas.push(salida);
}

if (flags.unir) {
  const lst = path.join(os.tmpdir(), `render_lista_${process.pid}.txt`);
  fs.writeFileSync(lst, salidas.map((p) => `file '${p.replace(/\\/g, '/').replace(/'/g, "'\\''")}'`).join('\n') + '\n');
  ffmpegOk(['-f', 'concat', '-safe', '0', '-i', lst, '-c', 'copy', '-movflags', '+faststart', path.resolve(flags.unir)]);
  fs.rmSync(lst, {force: true});
  console.log(`unido: ${path.resolve(flags.unir)}`);
}
