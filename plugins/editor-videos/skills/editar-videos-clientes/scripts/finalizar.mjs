// Normaliza el audio de un render y (opcional) une partes en un solo video.
// Normalmente no hace falta: render.mjs ya entrega los videos normalizados.
//
// Normalizar: node finalizar.mjs norm <entrada.mp4> <salida.mp4> [--lufs -16]
//   (-16 para VSL/confirmación en web, -14 para anuncios en redes)
// Unir:       node finalizar.mjs unir <salida.mp4> <parte1.mp4> <parte2.mp4> ...
//   (las partes deben venir del mismo motor: mismo códec, tamaño y fps)
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {assertEngine, ffmpegOk, normalizar, parseArgs} from './lib.mjs';

assertEngine();
const {pos, flags} = parseArgs(process.argv.slice(2));
const [modo, ...archivos] = pos;
if (modo === 'norm' && archivos.length === 2) {
  normalizar(archivos[0], archivos[1], flags.lufs ?? -16);
  console.log('listo:', archivos[1]);
} else if (modo === 'unir' && archivos.length >= 2) {
  const [dst, ...parts] = archivos;
  const lst = path.join(os.tmpdir(), `finalizar_lista_${process.pid}.txt`);
  fs.writeFileSync(lst, parts.map((p) => `file '${path.resolve(p).replace(/\\/g, '/').replace(/'/g, "'\\''")}'`).join('\n') + '\n');
  ffmpegOk(['-f', 'concat', '-safe', '0', '-i', lst, '-c', 'copy', '-movflags', '+faststart', dst]);
  fs.rmSync(lst, {force: true});
  console.log('listo:', dst);
} else {
  console.error('Uso: node finalizar.mjs norm <entrada.mp4> <salida.mp4> [--lufs -16]\n     node finalizar.mjs unir <salida.mp4> <parte1.mp4> <parte2.mp4> ...');
  process.exit(1);
}
