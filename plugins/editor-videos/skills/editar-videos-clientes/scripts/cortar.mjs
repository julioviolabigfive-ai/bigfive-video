// Quita silencios, muletillas y tomas falsas, con cortes suaves, y re-mapea las palabras para Remotion.
//
// Uso:
//   node cortar.mjs --video <mp4> --palabras <json> --id p1 --remotion <carpeta remotion>
//     [--desde "frase inicial"]        recorta lo anterior (parte que repite el final de la anterior)
//     [--fix "Cova=Coba;BSL=VSL"]      corrige texto de subtítulos
//     [--borrar "12.40-12.85;30.1-33"] borra rangos del video original (muletillas de contexto, tomas repetidas)
//     [--suave 0.12]                   duración del fundido de cada corte en segundos (0 = corte seco)
//     [--maxgap 0.30]                  pausa máxima que se conserva
// Salida: <remotion>/public/<id>_cut.mp4 y <remotion>/src/<id>_words.json
// Las muletillas puras (eh, em, mm...) se quitan solas. "Este", "o sea", "bueno" pueden ser palabras
// legítimas: revisar el contexto y borrarlas con --borrar.
import {spawn} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {assertEngine, FPS, ffmpegOk, ffmpegPath, paraleloFfmpeg, parseArgs, probe, readJson} from './lib.mjs';

assertEngine();
const {flags: a} = parseArgs(process.argv.slice(2));
for (const k of ['video', 'palabras', 'id', 'remotion']) {
  if (!a[k]) {
    console.error(`Falta --${k}. Uso: node cortar.mjs --video <mp4> --palabras <json> --id p1 --remotion <carpeta remotion>`);
    process.exit(1);
  }
}
const SUAVE = a.suave !== undefined ? Number(a.suave) : 0.12;
const MAXGAP = a.maxgap !== undefined ? Number(a.maxgap) : 0.3;
const TAIL = 0.13;
const HEAD = 0.09;
const MULETILLAS = new Set(['eh', 'ehh', 'ehm', 'em', 'emm', 'mm', 'mmm', 'hmm', 'ah', 'ahh']);
const norm = (x) => x.toLowerCase().replace(/[^a-z0-9áéíóúñ]/g, '');
const fixes = Object.fromEntries(
  String(a.fix ?? '').split(';').filter((p) => p.includes('=')).map((p) => [p.slice(0, p.indexOf('=')), p.slice(p.indexOf('=') + 1)]),
);
const rangos = String(a.borrar ?? '').split(';').filter((r) => r.includes('-')).map((r) => r.split('-').map(Number));
let words = readJson(a.palabras).words;

for (const w of words) {
  const core = w.w.replace(/[.,?!]+$/, '');
  if (core in fixes) w.w = w.w.replace(core, fixes[core]);
}

// Whisper separa los miles ("45" ".000"): se unen.
const merged = [];
for (const w of words) {
  const prev = merged[merged.length - 1];
  if (prev && /^[.,]\d{3}\W*$/.test(w.w) && /\d$/.test(prev.w)) merged[merged.length - 1] = {...prev, w: prev.w + w.w, e: w.e};
  else merged.push(w);
}
words = merged;

if (a.desde) {
  const toks = String(a.desde).split(/\s+/).map(norm);
  const idx = words.findIndex((_, i) => toks.every((t, k) => i + k < words.length && norm(words[i + k].w) === t));
  if (idx < 0) throw new Error(`No se encontró --desde "${a.desde}" en la transcripción.`);
  words = words.slice(idx);
}

const kept = [];
let quitadas = 0;
let cortarAqui = false;
for (const w of words) {
  const centro = (w.s + w.e) / 2;
  if (MULETILLAS.has(norm(w.w)) || rangos.some(([x, y]) => x <= centro && centro <= y)) {
    quitadas++;
    cortarAqui = true;
    continue;
  }
  kept.push({...w, cut: cortarAqui});
  cortarAqui = false;
}
words = kept;

const {duration: dur} = probe(a.video);
let segs = [];
let start = Math.max(0, words[0].s - 0.08);
for (let k = 0; k < words.length - 1; k++) {
  const x = words[k];
  const y = words[k + 1];
  const gap = y.s - x.e;
  if (gap > MAXGAP || y.cut) {
    segs.push([start, x.e + Math.min(TAIL, Math.max(gap, 0) / 2)]);
    start = y.s - Math.min(HEAD, Math.max(gap, 0) / 2);
  }
}
segs.push([start, Math.min(dur, words[words.length - 1].e + 0.45)]);
segs = segs.map(([s, e]) => [Math.round(s * FPS) / FPS, Math.round(e * FPS) / FPS]);

const D = SUAVE && segs.length > 1 && Math.min(...segs.map(([s, e]) => e - s)) > SUAVE * 2 ? SUAVE : 0;
if (SUAVE && !D && segs.length > 1) console.log('Aviso: hay un segmento muy corto; se usan cortes secos.');
const offsets = [];
let off = 0;
for (const [s, e] of segs) {
  offsets.push(off);
  off += e - s - D;
}
const total = off + D;

const remap = (t) => {
  for (let k = 0; k < segs.length; k++) if (t <= segs[k][1]) return offsets[k] + Math.max(0, t - segs[k][0]);
  return total;
};
const r3 = (n) => Math.round(n * 1000) / 1000;
const outWords = words.map((w) => ({w: w.w, s: r3(remap(w.s)), e: r3(remap(w.e))}));

// Armado por tramos, con memoria acotada en cualquier PC: un filtro único sobre el video entero acumula
// fotogramas y en un VSL de 10 min supera los 10 GB de RAM.
//   1. Cada segmento se extrae a su propio archivo (búsqueda directa: memoria constante), varios a la vez.
//   2. Se unen de a GRUPO con fundidos; si hay más, los grupos se vuelven a unir igual (también con fundido).
const rem = path.resolve(a.remotion);
const tmp = fs.mkdtempSync(path.join(path.dirname(rem), `${a.id}_tramos_`));
// Intermedios: video casi sin pérdida y rápido, y el audio aparte en WAV con el largo exacto en muestras.
// Juntos en un contenedor, cada tramo perdía ~13 ms de audio y en 144 tramos la voz se adelantaba 1,5 s.
// Solo el archivo final se arma con video y audio juntos y calidad de entrega.
const ENC_V = ['-an', '-c:v', 'libx264', '-crf', '10', '-preset', 'ultrafast', '-r', String(FPS), '-pix_fmt', 'yuv420p'];
const ENC_A = ['-vn', '-c:a', 'pcm_s16le', '-ar', '48000', '-ac', '2'];
const ENC = ['-c:v', 'libx264', '-crf', '14', '-preset', 'fast', '-r', String(FPS), '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '256k', '-ar', '48000', '-movflags', '+faststart'];
const GRUPO = 12;

const ffmpegAsync = (args) =>
  new Promise((resolve, reject) => {
    const p = spawn(ffmpegPath(), ['-hide_banner', '-v', 'error', '-y', ...args]);
    let err = '';
    p.stderr.on('data', (d) => (err += d));
    p.on('close', (code) => (code === 0 ? resolve() : reject(new Error(err))));
  });

const piezas = segs.map(([s, e], i) => ({v: path.join(tmp, `s${i}.mov`), a: path.join(tmp, `s${i}.wav`), dur: e - s, s}));
const tareas = piezas.flatMap((p) => [
  ['-ss', p.s.toFixed(3), '-i', a.video, '-vf', `fps=${FPS},format=yuv420p`, '-frames:v', String(Math.round(p.dur * FPS)), ...ENC_V, p.v],
  ['-ss', p.s.toFixed(3), '-i', a.video, '-af', `asetpts=PTS-STARTPTS,apad=whole_dur=${p.dur.toFixed(3)},atrim=0:${p.dur.toFixed(3)}`, ...ENC_A, p.a],
]);
// Tantos ffmpeg a la vez como permiten los hilos y la RAM libre de esta PC.
const paralelo = paraleloFfmpeg();
let siguiente = 0;
await Promise.all(Array.from({length: paralelo}, async () => {
  while (siguiente < tareas.length) await ffmpegAsync(tareas[siguiente++]);
}));

let n = 0;
const unir = (ps, final) => {
  if (ps.length === 1 && !final) return ps[0];
  if (ps.length > GRUPO) {
    const grupos = [];
    for (let i = 0; i < ps.length; i += GRUPO) grupos.push(unir(ps.slice(i, i + GRUPO), false));
    return unir(grupos, final);
  }
  // Cada tramo entra como dos archivos: video (entrada 2i) y audio (entrada 2i+1).
  const ins = ps.map((_, i) => `[${2 * i}:v]fps=${FPS},settb=AVTB,format=yuv420p,setpts=PTS-STARTPTS[v${i}];[${2 * i + 1}:a]asetpts=PTS-STARTPTS[a${i}];`).join('');
  let fc;
  if (D) {
    let lv = 'v0';
    let la = 'a0';
    let o = 0;
    const chain = [];
    for (let i = 1; i < ps.length; i++) {
      o += ps[i - 1].dur - D;
      chain.push(`[${lv}][v${i}]xfade=transition=fade:duration=${D}:offset=${o.toFixed(3)}[xv${i}];[${la}][a${i}]acrossfade=d=${D}:c1=tri:c2=tri[xa${i}];`);
      lv = `xv${i}`;
      la = `xa${i}`;
    }
    fc = ins + chain.join('') + `[${lv}]null[v];[${la}]anull[a]`;
  } else {
    fc = ins + ps.map((_, i) => `[v${i}][a${i}]`).join('') + `concat=n=${ps.length}:v=1:a=1[v][a]`;
  }
  const ins2 = ps.flatMap((p) => ['-i', p.v, '-i', p.a]);
  const dur2 = ps.reduce((sum, p) => sum + p.dur, 0) - D * (ps.length - 1);
  const k = n++;
  if (final) {
    const out = path.join(tmp, `final.mp4`);
    ffmpegOk([...ins2, '-filter_complex', fc, '-map', '[v]', '-map', '[a]', ...ENC, out]);
    return {v: out, dur: dur2};
  }
  const v = path.join(tmp, `u${k}.mov`);
  const au = path.join(tmp, `u${k}.wav`);
  ffmpegOk([...ins2, '-filter_complex', fc, '-map', '[v]', ...ENC_V, v, '-map', '[a]', ...ENC_A, au]);
  return {v, a: au, dur: dur2};
};
const final = unir(piezas, true);
fs.copyFileSync(final.v, path.join(rem, 'public', `${a.id}_cut.mp4`));
fs.rmSync(tmp, {recursive: true, force: true});
fs.writeFileSync(path.join(rem, 'src', `${a.id}_words.json`), JSON.stringify({duration: r3(total), words: outWords}));
console.log(`${a.id}: segmentos=${segs.length} quitadas=${quitadas} fundido=${D}s original=${dur.toFixed(2)}s cortado=${total.toFixed(2)}s`);
console.log(outWords.map((w) => w.w).join(' '));
