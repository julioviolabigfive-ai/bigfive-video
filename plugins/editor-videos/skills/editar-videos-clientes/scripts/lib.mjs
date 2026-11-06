// Rutas y utilidades compartidas por los scripts de la skill.
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

export const SKILL_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const TEMPLATE_DIR = path.join(SKILL_DIR, 'engine');
const version = JSON.parse(fs.readFileSync(path.join(TEMPLATE_DIR, 'package.json'), 'utf8')).version;
export const ENGINE_DIR = path.join(os.homedir(), '.bigfive-video', `engine-${version}`);
export const WHISPER_DIR = path.join(os.homedir(), '.bigfive-video', 'whisper.cpp');
export const WHISPER_VERSION = '1.5.5';
// Modelo de Whisper según la PC: `medium` (mejor precisión, ~1,5 GB de RAM) si hay 8 GB o más; si no, `small`.
export const DEFAULT_MODEL = os.totalmem() >= 7.5 * 1024 ** 3 ? 'medium' : 'small';
export const FPS = 25;

// Efectos de sonido aprobados: salen de la biblioteca de media-use (paquete npm hyperframes, licencia Pixabay).
export const SFX_PKG = 'hyperframes@0.9.8';
export const SFX_FILES = ['click-soft.mp3', 'impact-bass-1.mp3', 'whoosh-short.mp3', 'whoosh-cinematic.mp3'];

export const engineRequire = () => createRequire(path.join(ENGINE_DIR, 'package.json'));

export const importFromEngine = async (name) =>
  import(pathToFileURL(engineRequire().resolve(name)).href);

export const ffmpegPath = () => engineRequire()('ffmpeg-static');

// En Windows hace falta la consola para npm/npx (.cmd); ahí se ponen entre comillas los argumentos con espacios,
// si no una ruta como "C:\Proyectos\Skill Editar\..." se parte en dos.
export const run = (cmd, args, opts = {}) => {
  const shell = process.platform === 'win32';
  const q = (a) => (shell && /[\s&()]/.test(a) && !/^".*"$/.test(a) ? `"${a}"` : a);
  // Con consola, el comando va armado en un solo texto (pasar la lista con shell genera un aviso de Node).
  const r = shell
    ? spawnSync([cmd, ...args].map(q).join(' '), {stdio: 'inherit', shell, ...opts})
    : spawnSync(cmd, args, {stdio: 'inherit', ...opts});
  if (r.status !== 0) throw new Error(`Falló: ${cmd} ${args.join(' ')}`);
  return r;
};

export const ffmpeg = (args, opts = {}) =>
  spawnSync(ffmpegPath(), ['-hide_banner', ...args], {encoding: 'utf8', maxBuffer: 1 << 28, ...opts});

// Igual que ffmpeg() pero corta el script si falla.
export const ffmpegOk = (args, opts = {}) => {
  const r = ffmpeg(['-v', 'error', '-y', ...args], opts);
  if (r.status !== 0) throw new Error(r.stderr || `ffmpeg falló: ${args.join(' ')}`);
  return r;
};

export const probe = (file) => {
  const out = ffmpeg(['-i', file]).stderr;
  const d = out.match(/Duration: (\d+):(\d+):([\d.]+)/);
  const dims = out.match(/Video:.*?(\d{2,5})x(\d{2,5})/);
  let [width, height] = dims ? [Number(dims[1]), Number(dims[2])] : [0, 0];
  if (/rotation of -?90|rotate\s*:\s*-?90/.test(out)) [width, height] = [height, width];
  const duration = d ? Number(d[1]) * 3600 + Number(d[2]) * 60 + Number(d[3]) : 0;
  return {duration, width, height};
};

// Normaliza el audio a `lufs` en dos pasadas (una sola pasada se queda ~1 LU corta). El video se copia sin recodificar.
export const normalizar = (src, dst, lufs = -16) => {
  const base = `loudnorm=I=${lufs}:TP=-1.5:LRA=11`;
  const m = JSON.parse(ffmpeg(['-i', src, '-af', `${base}:print_format=json`, '-f', 'null', '-']).stderr.match(/\{[\s\S]*?\}/g).pop());
  const af = `${base}:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true`;
  fs.mkdirSync(path.dirname(path.resolve(dst)), {recursive: true});
  ffmpegOk(['-i', src, '-c:v', 'copy', '-af', af, '-c:a', 'aac', '-b:a', '256k', '-ar', '48000', '-movflags', '+faststart', dst]);
};

// Une imágenes en una grilla, todas a la misma altura (celdas vacías en negro).
export const hojaImagenes = (salida, imgs, {alto = 432, columnas = 3} = {}) => {
  const cols = Math.min(imgs.length, columnas);
  const scaled = imgs.map((_, i) => `[${i}:v]scale=-2:${alto},setsar=1[s${i}]`).join(';');
  const layout = imgs
    .map((_, i) => {
      const c = i % cols;
      const r = Math.floor(i / cols);
      const x = c === 0 ? '0' : Array.from({length: c}, (_, k) => `w${r * cols + k}`).join('+');
      return `${x}_${r * alto}`;
    })
    .join('|');
  const fc =
    imgs.length === 1
      ? `${scaled};[s0]null[out]`
      : `${scaled};${imgs.map((_, i) => `[s${i}]`).join('')}xstack=inputs=${imgs.length}:layout=${layout}:fill=black[out]`;
  ffmpegOk([...imgs.flatMap((p) => ['-i', p]), '-filter_complex', fc, '-map', '[out]', '-frames:v', '1', '-q:v', '3', salida]);
  return {cols, rows: Math.ceil(imgs.length / cols)};
};

// Empaqueta el proyecto Remotion UNA vez (código + public/) para renderizar varias composiciones o stills
// sin repetir el empaquetado ni la copia de los videos de public/ en cada comando.
export const empaquetar = async (proyecto) => {
  const {bundle} = engineRequire()('@remotion/bundler');
  const t0 = Date.now();
  const url = await bundle({
    entryPoint: path.join(proyecto, 'src', 'index.ts'),
    publicDir: path.join(proyecto, 'public'),
    outDir: path.join(proyecto, '..', 'bundle'),
    onProgress: () => {},
  });
  console.log(`Proyecto empaquetado en ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  return url;
};

// Mismos ajustes de imagen que remotion.config.ts (la API no lee ese archivo).
export const RENDER_OPTS = {codec: 'h264', crf: 16, imageFormat: 'jpeg', jpegQuality: 95};

export const tamanoCarpeta = (dir) => {
  let n = 0;
  for (const e of fs.readdirSync(dir, {withFileTypes: true})) {
    const p = path.join(dir, e.name);
    n += e.isDirectory() ? tamanoCarpeta(p) : fs.statSync(p).size;
  }
  return n;
};

// Remotion copia los videos de cada render y de cada still a carpetas temporales (remotion-v<versión>-assets…)
// y no siempre las borra: con el uso se acumulan decenas de GB en la carpeta temporal del sistema.
const TEMP_REMOTION = /^remotion-v[\d.]+-assets/;
const temporalesRemotion = () => {
  try {
    return fs.readdirSync(os.tmpdir()).filter((n) => TEMP_REMOTION.test(n)).map((n) => path.join(os.tmpdir(), n));
  } catch {
    return [];
  }
};
// Una carpeta en uso por un render tiene archivos abiertos y, en Windows, no se puede renombrar. Por eso se renombra
// antes de borrar: si falla, es de un render en curso y no se toca (ni queda a medio borrar).
const borrarSiLibre = (p) => {
  const aparte = `${p}-borrando-${process.pid}`;
  try {
    fs.renameSync(p, aparte);
  } catch {
    return 0;
  }
  let bytes = 0;
  try {
    bytes = tamanoCarpeta(aparte);
  } catch {}
  fs.rmSync(aparte, {recursive: true, force: true});
  return bytes;
};
// Borra las carpetas temporales de Remotion que no estén en uso: las sin tocar hace más de `minutos` y las de `ademas`.
// Devuelve los bytes liberados.
export const limpiarTemporales = (minutos = 2, ademas = new Set()) => {
  const limite = Date.now() - minutos * 60 * 1000;
  let bytes = 0;
  for (const p of temporalesRemotion()) {
    try {
      if (!ademas.has(p) && fs.statSync(p).mtimeMs > limite) continue;
      bytes += borrarSiLibre(p);
    } catch {} // bloqueada: la borra la próxima limpieza
  }
  return bytes;
};
// Se llama al empezar cada script que renderiza. Limpia siempre, no solo si algo falla:
//   - al empezar, borra lo que dejaron usos anteriores, incluidos renders cortados (Claude cerrado, PC apagada);
//   - al salir, bien o con error, borra las carpetas que creó este render;
//   - con Ctrl+C o al detener el proceso, sale ordenado para que también se borren.
export const mantenerTemporalesLimpios = () => {
  limpiarTemporales();
  const antes = new Set(temporalesRemotion());
  process.on('exit', () => limpiarTemporales(2, new Set(temporalesRemotion().filter((p) => !antes.has(p)))));
  for (const senal of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.on(senal, () => process.exit(130));
};

// Capacidad medida de esta PC (calibrar.mjs). Cada script usa el máximo que rinde el equipo.
export const EQUIPO_FILE = path.join(os.homedir(), '.bigfive-video', 'equipo.json');
export const equipo = () => {
  try {
    const e = JSON.parse(fs.readFileSync(EQUIPO_FILE, 'utf8'));
    // Si cambió el hardware, la medida ya no vale (setup.mjs vuelve a calibrar).
    if (e.nucleos === (os.availableParallelism?.() ?? os.cpus().length)) return e;
  } catch {}
  return null;
};
// Cuántos ffmpeg a la vez para cortar: la mitad de los hilos, sin pasar la RAM libre (~0,8 GB cada uno a 1080p).
export const paraleloFfmpeg = () => {
  const hilos = os.availableParallelism?.() ?? os.cpus().length;
  return Math.max(1, Math.min(Math.floor(hilos / 2), Math.floor(os.freemem() / (0.8 * 1024 ** 3))));
};

export const assertEngine = () => {
  if (!fs.existsSync(path.join(ENGINE_DIR, 'node_modules', 'remotion'))) {
    console.error(`El motor no está instalado. Ejecuta primero: node "${path.join(SKILL_DIR, 'scripts', 'setup.mjs')}"`);
    process.exit(1);
  }
};

export const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
export const writeJson = (p, data) => fs.writeFileSync(p, JSON.stringify(data, null, 1) + '\n');

export const parseArgs = (argv) => {
  const pos = [];
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const [k, v] = argv[i].slice(2).split('=');
      flags[k] = v ?? (argv[i + 1] !== undefined && !argv[i + 1].startsWith('--') ? argv[++i] : true);
    } else pos.push(argv[i]);
  }
  return {pos, flags};
};
