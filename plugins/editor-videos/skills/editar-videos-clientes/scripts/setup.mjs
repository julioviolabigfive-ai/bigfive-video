// Instala (una vez por PC) el motor de edición: Remotion, ffmpeg, navegador de render y Whisper.
// Uso: node setup.mjs [--model medium|small]   (por defecto, según la RAM de la PC)
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {DEFAULT_MODEL, ENGINE_DIR, equipo, importFromEngine, parseArgs, run, SFX_FILES, SFX_PKG, TEMPLATE_DIR, WHISPER_DIR, WHISPER_VERSION} from './lib.mjs';

const {flags} = parseArgs(process.argv.slice(2));
const model = flags.model ?? DEFAULT_MODEL;

const major = Number(process.versions.node.split('.')[0]);
if (major < 18) {
  console.error(`Se necesita Node.js 18 o superior (tienes ${process.versions.node}).`);
  process.exit(1);
}

const nucleos = os.availableParallelism?.() ?? os.cpus().length;
const ram = os.totalmem() / 1024 ** 3;
console.log(`PC: ${nucleos} hilos, ${ram.toFixed(0)} GB de RAM. Modelo de transcripción: ${model}.`);

// Espacio: una instalación nueva necesita ~2,5 GB, más el espacio de los videos de cada sesión.
const fresh = !fs.existsSync(path.join(ENGINE_DIR, 'node_modules', 'remotion'));
if (fresh && fs.statfsSync) {
  fs.mkdirSync(path.dirname(ENGINE_DIR), {recursive: true});
  const st = fs.statfsSync(path.dirname(ENGINE_DIR));
  const libreGb = (st.bavail * st.bsize) / 1024 ** 3;
  if (libreGb < 4) {
    console.error(`Hay ${libreGb.toFixed(1)} GB libres en el disco del usuario; hacen falta al menos 4 GB. Libera espacio y vuelve a intentar.`);
    process.exit(1);
  }
}

// El código del motor se copia siempre, así una actualización del plugin llega a todos.
fs.mkdirSync(ENGINE_DIR, {recursive: true});
fs.cpSync(TEMPLATE_DIR, ENGINE_DIR, {recursive: true, filter: (src) => !src.includes('node_modules')});
console.log(`Motor copiado en ${ENGINE_DIR}`);

if (!fs.existsSync(path.join(ENGINE_DIR, 'node_modules', 'remotion'))) {
  const hasLock = fs.existsSync(path.join(ENGINE_DIR, 'package-lock.json'));
  run('npm', [hasLock ? 'ci' : 'install', '--no-audit', '--no-fund'], {cwd: ENGINE_DIR});
}

run('npx', ['remotion', 'browser', 'ensure'], {cwd: ENGINE_DIR});

const {installWhisperCpp, downloadWhisperModel} = await importFromEngine('@remotion/install-whisper-cpp');
if (process.platform === 'win32') {
  // El instalador de Remotion en Windows no soporta rutas con espacios; se hace aquí con rutas entre comillas.
  if (!fs.existsSync(path.join(WHISPER_DIR, 'main.exe'))) {
    const zip = path.join(os.tmpdir(), `whisper-bin-x64-${WHISPER_VERSION}.zip`);
    console.log('Descargando Whisper…');
    const res = await fetch('https://remotion-ffmpeg-binaries.s3.eu-central-1.amazonaws.com/whisper-bin-x64-1-5-5.zip');
    if (!res.ok) throw new Error(`No se pudo descargar Whisper (${res.status})`);
    fs.writeFileSync(zip, Buffer.from(await res.arrayBuffer()));
    const q = (p) => `'${p.replace(/'/g, "''")}'`;
    const r = spawnSync(
      'powershell',
      ['-NoProfile', '-Command', `Expand-Archive -Force -LiteralPath ${q(zip)} -DestinationPath ${q(WHISPER_DIR)}`],
      {stdio: 'inherit'},
    );
    fs.rmSync(zip, {force: true});
    if (r.status !== 0) throw new Error('No se pudo descomprimir Whisper.');
  }
} else {
  await installWhisperCpp({to: WHISPER_DIR, version: WHISPER_VERSION, printOutput: true});
}
await downloadWhisperModel({model, folder: WHISPER_DIR, printOutput: true});

// Efectos de sonido: se toman del paquete público de media-use (no se redistribuyen en el plugin).
const sfxDir = path.join(ENGINE_DIR, 'public', 'sfx');
if (!SFX_FILES.every((f) => fs.existsSync(path.join(sfxDir, f)))) {
  console.log('Descargando efectos de sonido…');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bigfive-sfx-'));
  run('npm', ['pack', SFX_PKG, '--silent'], {cwd: tmp, stdio: 'ignore'});
  const tgz = fs.readdirSync(tmp).find((f) => f.endsWith('.tgz'));
  const inner = 'package/dist/skills/media-use/audio/assets/sfx';
  run('tar', ['-xzf', tgz, ...SFX_FILES.map((f) => `${inner}/${f}`), `${inner}/CREDITS.md`], {cwd: tmp});
  fs.mkdirSync(sfxDir, {recursive: true});
  for (const f of [...SFX_FILES, 'CREDITS.md']) fs.copyFileSync(path.join(tmp, inner, f), path.join(sfxDir, f));
  fs.rmSync(tmp, {recursive: true, force: true});
}

// Medir la capacidad de esta PC (una vez, o si cambió el hardware) para renderizar al máximo que rinde.
if (!equipo() || flags.calibrar) run('node', [path.join(path.dirname(fileURLToPath(import.meta.url)), 'calibrar.mjs')]);

// Versiones anteriores del motor (~550 MB cada una): ya no se usan.
for (const d of fs.readdirSync(path.dirname(ENGINE_DIR))) {
  const full = path.join(path.dirname(ENGINE_DIR), d);
  if (d.startsWith('engine-') && full !== ENGINE_DIR) {
    fs.rmSync(full, {recursive: true, force: true});
    console.log(`Borrada la versión anterior del motor: ${d}`);
  }
}

console.log('\nListo. El motor de edición BigFive está instalado.');
