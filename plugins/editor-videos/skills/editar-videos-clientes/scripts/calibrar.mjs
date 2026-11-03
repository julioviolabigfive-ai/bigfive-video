// Mide la capacidad real de esta PC (una vez) para que el render use el máximo que rinde cada equipo:
// prueba varias cantidades de fotogramas en paralelo con una carga típica y guarda la más rápida en
// %USERPROFILE%\.bigfive-video\equipo.json. Lo corre setup.mjs; se puede repetir con: node calibrar.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {assertEngine, ENGINE_DIR, engineRequire, EQUIPO_FILE, ffmpegOk, RENDER_OPTS} from './lib.mjs';

assertEngine();
const nucleos = os.availableParallelism?.() ?? os.cpus().length;
const ramGb = os.totalmem() / 1024 ** 3;

const dir = path.join(ENGINE_DIR, 'calibracion');
const pub = path.join(dir, 'public');
fs.mkdirSync(pub, {recursive: true});
fs.cpSync(path.join(ENGINE_DIR, 'public', 'sfx'), path.join(pub, 'sfx'), {recursive: true});
const video = path.join(pub, 'calibracion.mp4');
if (!fs.existsSync(video)) {
  ffmpegOk(['-f', 'lavfi', '-i', 'testsrc2=size=1920x1080:rate=25:duration=6', '-f', 'lavfi', '-i', 'sine=frequency=440:duration=6',
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-shortest', video]);
}

// Remotion busca su navegador desde la carpeta actual.
process.chdir(ENGINE_DIR);
const {bundle} = engineRequire()('@remotion/bundler');
const {selectComposition, renderMedia} = engineRequire()('@remotion/renderer');
const serveUrl = await bundle({entryPoint: path.join(dir, 'index.tsx'), publicDir: pub, outDir: path.join(dir, 'bundle'), onProgress: () => {}});
const composition = await selectComposition({serveUrl, id: 'Calibracion', inputProps: {}});

// Candidatos según los hilos, sin pasar lo que aguanta la RAM (~0,4 GB por pestaña, dejando 3 GB al sistema).
const tope = Math.max(1, Math.min(nucleos, Math.floor((ramGb - 3) / 0.4)));
const candidatos = [...new Set([Math.round(nucleos / 4), Math.round(nucleos / 2), Math.round((nucleos * 3) / 4), nucleos].map((c) => Math.max(1, Math.min(tope, c))))].sort((a, b) => a - b);
const FRAMES = 100;
const medidas = {};
for (const concurrency of candidatos) {
  const t0 = Date.now();
  await renderMedia({serveUrl, composition, outputLocation: path.join(dir, 'prueba.mp4'), inputProps: {}, ...RENDER_OPTS, frameRange: [0, FRAMES - 1], concurrency});
  medidas[concurrency] = (Date.now() - t0) / 1000;
  console.log(`  ${concurrency} en paralelo: ${(FRAMES / medidas[concurrency]).toFixed(1)} fotogramas/s`);
}
// Siempre la más rápida que midió esta PC.
const elegido = Number(Object.entries(medidas).sort((a, b) => a[1] - b[1])[0][0]);
const segPorSeg = (medidas[elegido] / FRAMES) * 25;
fs.writeFileSync(EQUIPO_FILE, JSON.stringify({nucleos, ramGb: Math.round(ramGb), concurrency: elegido, segPorSegundoDeVideo: Number(segPorSeg.toFixed(2)), fecha: new Date().toISOString()}, null, 1));
fs.rmSync(path.join(dir, 'prueba.mp4'), {force: true});
console.log(`Calibrado: ${elegido} fotogramas en paralelo, ~${segPorSeg.toFixed(1)} s de render por segundo de video. Guardado en ${EQUIPO_FILE}`);
