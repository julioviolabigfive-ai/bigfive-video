// Transcribe un video con Whisper y marcas de tiempo por palabra.
// Uso: node transcribir.mjs "<video>" "<salida.json>" [--modelo medium] [--hilos N]
// Salida: {"text": "...", "words": [{"w": "palabra", "s": inicio, "e": fin}, ...]} en segundos del video original.
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {assertEngine, DEFAULT_MODEL, ffmpeg, ffmpegOk, importFromEngine, parseArgs, probe, WHISPER_DIR, writeJson} from './lib.mjs';

assertEngine();
const {pos, flags} = parseArgs(process.argv.slice(2));
const [video, salida] = pos;
if (!video || !salida || !fs.existsSync(video)) {
  console.error('Uso: node transcribir.mjs "<video>" "<salida.json>" [--modelo medium] [--hilos N]');
  process.exit(1);
}
const model = flags.modelo ?? DEFAULT_MODEL;
const {duration} = probe(video);

const wav = path.join(os.tmpdir(), `transcribir_${process.pid}.wav`);
ffmpegOk(['-i', video, '-vn', '-ac', '1', '-ar', '16000', '-c:a', 'pcm_s16le', wav]);

// Se llama a Whisper directamente (mismos argumentos que transcribe() de Remotion) para poder pasarle
// todos los hilos del procesador: transcribe() no lo permite y Whisper usa 4 por defecto.
const {toCaptions, downloadWhisperModel} = await importFromEngine('@remotion/install-whisper-cpp');
if (!fs.existsSync(path.join(WHISPER_DIR, `ggml-${model}.bin`))) {
  console.error(`Descargando el modelo ${model} de Whisper (solo la primera vez)…`);
  await downloadWhisperModel({model, folder: WHISPER_DIR, printOutput: false});
}
const exe = path.join(WHISPER_DIR, process.platform === 'win32' ? 'main.exe' : 'main');
const dtw = model.replace(/-/g, '.'); // nombre del modelo para --dtw: large-v3 → large.v3
const threads = Number(flags.hilos ?? os.availableParallelism?.() ?? os.cpus().length);
const tmpJson = path.join(os.tmpdir(), `transcribir_${process.pid}`);
const t0 = Date.now();
const wr = spawnSync(
  exe,
  ['-f', wav, '--output-file', tmpJson, '--output-json', '--max-len', '1', '-ojf', '--dtw', dtw, '-m', path.join(WHISPER_DIR, `ggml-${model}.bin`), '-l', 'es', '-t', String(threads)],
  {cwd: WHISPER_DIR, encoding: 'utf8', maxBuffer: 1 << 28},
);
if (!fs.existsSync(`${tmpJson}.json`)) throw new Error(`Whisper falló:\n${wr.stderr?.slice(-2000)}`);
const out = JSON.parse(fs.readFileSync(`${tmpJson}.json`, 'utf8'));
fs.rmSync(`${tmpJson}.json`, {force: true});
console.error(`Whisper (${model}, ${threads} hilos): ${((Date.now() - t0) / 1000).toFixed(0)} s`);
const {captions} = toCaptions({whisperCppOutput: out});

// Une los tokens en palabras: un token sin espacio inicial continúa la palabra anterior.
const words = [];
for (const c of captions) {
  const raw = c.text;
  if (!raw.trim() || /^\[.*\]$/.test(raw.trim())) continue;
  if (raw.startsWith(' ') || !words.length) words.push({w: raw.trim(), s: c.startMs / 1000, e: c.endMs / 1000});
  else {
    const w = words[words.length - 1];
    w.w += raw.trim();
    w.e = c.endMs / 1000;
  }
}

// Whisper.cpp suele estirar la palabra anterior a una pausa hasta cubrir el silencio.
// Se ajustan los bordes con los silencios reales del audio para que cortar.mjs vea los huecos.
const sd = ffmpeg(['-i', wav, '-af', 'silencedetect=n=-35dB:d=0.2', '-f', 'null', '-']).stderr;
const silences = [];
for (const m of sd.matchAll(/silence_start: ([\d.]+)[\s\S]*?silence_end: ([\d.]+)/g)) {
  const s = {start: Number(m[1]), end: Number(m[2])};
  const last = silences[silences.length - 1];
  if (last && s.start - last.end < 0.05) last.end = s.end;
  else silences.push(s);
}
const tail = sd.match(/silence_start: ([\d.]+)(?![\s\S]*silence_end)/);
if (tail) silences.push({start: Number(tail[1]), end: duration});
for (const w of words) {
  for (const s of silences) {
    if (s.start > w.s + 0.08 && s.start < w.e) w.e = s.start;
    if (s.end > w.s && s.end < w.e - 0.08 && s.start <= w.s + 0.02) w.s = s.end;
  }
  w.e = Math.max(w.e, w.s + 0.05);
  w.s = Math.round(w.s * 1000) / 1000;
  w.e = Math.round(w.e * 1000) / 1000;
}
fs.rmSync(wav, {force: true});

const text = words.map((w) => w.w).join(' ');
writeJson(salida, {text, words});
console.log(text);
