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
import {assertEngine, empaquetar, engineRequire, equipo, ffmpegOk, normalizar, parseArgs, RENDER_OPTS} from './lib.mjs';

assertEngine();
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
  let ultimo = -10;
  await renderMedia({
    serveUrl, composition, outputLocation: crudo, inputProps: {}, ...RENDER_OPTS,
    scale: flags.borrador ? 0.5 : 1,
    // Paralelo medido para esta PC (calibrar.mjs); sin medida, el de Remotion (mitad de los hilos).
    concurrency: equipo()?.concurrency ?? null,
    onProgress: ({progress}) => {
      const p = Math.floor(progress * 100);
      if (p >= ultimo + 10) {
        ultimo = p - (p % 10);
        process.stdout.write(`${id}: ${ultimo}%\n`);
      }
    },
  });
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
