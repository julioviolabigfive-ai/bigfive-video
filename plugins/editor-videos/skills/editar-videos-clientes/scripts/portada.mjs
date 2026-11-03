// Ayuda a elegir el fotograma de la portada.
//
// Hoja de contactos:  node portada.mjs hoja <video> <salida.jpg> [--n 12] [--desde 0] [--hasta 0]
//   -> grilla de N fotogramas con el segundo EXACTO impreso; elegir cara expresiva y boca cerrada o sonrisa.
// Extraer fotograma:  node portada.mjs sacar <video> <salida.jpg> --t 12.4
//   -> fotograma a resolución completa (va a public/ del proyecto).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {assertEngine, ffmpegOk, parseArgs, probe} from './lib.mjs';

assertEngine();
const {pos, flags} = parseArgs(process.argv.slice(2));
const [modo, video, salida] = pos;
if (!['hoja', 'sacar'].includes(modo) || !video || !salida) {
  console.error('Uso: node portada.mjs hoja <video> <salida.jpg> [--n 12]\n     node portada.mjs sacar <video> <salida.jpg> --t 12.4');
  process.exit(1);
}

const FONTS = ['C:/Windows/Fonts/arialbd.ttf', '/System/Library/Fonts/Supplemental/Arial Bold.ttf', '/Library/Fonts/Arial Bold.ttf'];
const font = FONTS.find((p) => fs.existsSync(p));
const label = (text) =>
  font
    ? `,drawbox=x=0:y=0:w=${14 + 16 * text.length}:h=38:color=black:t=fill,` +
      `drawtext=fontfile='${font.replace(':', '\\:')}':text='${text}':x=8:y=6:fontsize=26:fontcolor=white`
    : '';
const grab = (t, out, vf = '') =>
  ffmpegOk(['-ss', t.toFixed(3), '-i', video, '-frames:v', '1', '-q:v', '2', ...(vf ? ['-vf', vf] : []), out]);

if (modo === 'sacar') {
  grab(Number(flags.t ?? 0), salida);
} else {
  const n = Number(flags.n ?? 12);
  const {duration} = probe(video);
  const t0 = Number(flags.desde ?? 0);
  const t1 = Number(flags.hasta ?? 0) || duration - 0.2;
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hoja-'));
  const times = Array.from({length: n}, (_, k) => t0 + ((t1 - t0) * (k + 0.5)) / n);
  times.forEach((t, k) => {
    grab(t, path.join(tmp, `${String(k).padStart(3, '0')}.jpg`), `scale='if(gt(iw,ih),480,-2)':'if(gt(iw,ih),-2,480)'${label(`${t.toFixed(2)}s`)}`);
  });
  const cols = n >= 8 ? 4 : n;
  const rows = Math.ceil(n / cols);
  ffmpegOk(['-framerate', '1', '-i', path.join(tmp, '%03d.jpg'), '-vf', `tile=${cols}x${rows}`, '-frames:v', '1', '-q:v', '3', salida]);
  fs.rmSync(tmp, {recursive: true, force: true});
  if (!font) console.log('Sin fuente para imprimir los segundos. Orden de los fotogramas:', times.map((t) => t.toFixed(2)).join(', '));
}
console.log('listo:', salida);
