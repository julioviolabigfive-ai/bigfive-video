// Carpetas de cada edición: una por sesión, para no mezclar trabajos.
//
// Nueva sesión:  node sesion.mjs nueva ["Marca o proyecto"] [--base "<carpeta>"]
//   Crea <base>/<AAAA-MM-DD HH.MM> <Marca>/ con "Crudos" y "Terminados", abre "Crudos" en el explorador
//   e imprime las rutas. Base por defecto: Documentos/Edición de videos. Antes, borra las copias temporales de
//   Remotion que hayan quedado de usos anteriores.
// Abrir carpeta: node sesion.mjs abrir "<carpeta>"
//   Abre la carpeta en el explorador (al terminar: la de Terminados).
// Limpiar:       node sesion.mjs limpiar "<sesión>"
//   Borra lo regenerable de _edicion (empaquetado y renders intermedios). Deja crudos, cortes y composiciones
//   para poder hacer correcciones después. También borra las copias temporales que Remotion deja en la carpeta
//   temporal del sistema (render.mjs y stills.mjs ya limpian al empezar y al terminar; esto barre lo que quedó).
import {spawn, spawnSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {limpiarTemporales, parseArgs, tamanoCarpeta} from './lib.mjs';

export const CRUDOS = 'Crudos';
export const TERMINADOS = 'Terminados';

const abrir = (dir) => {
  const cmd = process.platform === 'win32' ? 'explorer.exe' : process.platform === 'darwin' ? 'open' : 'xdg-open';
  spawn(cmd, [path.resolve(dir)], {detached: true, stdio: 'ignore'}).unref();
};

// Carpeta Documentos real: en Windows puede estar redirigida a OneDrive u otra unidad.
const documentos = () => {
  if (process.platform === 'win32') {
    const r = spawnSync('powershell', ['-NoProfile', '-Command', "[Environment]::GetFolderPath('MyDocuments')"], {encoding: 'utf8'});
    const p = r.stdout?.trim();
    if (p && fs.existsSync(p)) return p;
  }
  return path.join(os.homedir(), 'Documents');
};

const {pos, flags} = parseArgs(process.argv.slice(2));
const [modo, arg] = pos;
if (modo === 'limpiar' && arg) {
  let liberado = 0;
  for (const d of ['bundle', 'render']) {
    const p = path.join(arg, '_edicion', d);
    if (fs.existsSync(p)) {
      liberado += tamanoCarpeta(p);
      fs.rmSync(p, {recursive: true, force: true});
    }
  }
  console.log(`Liberados ${(liberado / 1024 ** 2).toFixed(0)} MB en ${path.join(arg, '_edicion')}`);
  const temporales = limpiarTemporales();
  console.log(`Liberados ${(temporales / 1024 ** 2).toFixed(0)} MB de temporales de Remotion`);
} else if (modo === 'nueva') {
  const temporales = limpiarTemporales();
  if (temporales) console.log(`Liberados ${(temporales / 1024 ** 2).toFixed(0)} MB de temporales de Remotion que quedaron de usos anteriores`);
  const base = path.resolve(flags.base ?? path.join(documentos(), 'Edición de videos'));
  const d = new Date();
  const p2 = (n) => String(n).padStart(2, '0');
  const fecha = `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())} ${p2(d.getHours())}.${p2(d.getMinutes())}`;
  const nombre = String(arg ?? '').replace(/[<>:"/\\|?*]/g, '').trim();
  const dir = path.join(base, nombre ? `${fecha} ${nombre}` : fecha);
  fs.mkdirSync(path.join(dir, CRUDOS), {recursive: true});
  fs.mkdirSync(path.join(dir, TERMINADOS), {recursive: true});
  abrir(path.join(dir, CRUDOS));
  console.log(`Sesión: ${dir}`);
  console.log(`Crudos (abierta): ${path.join(dir, CRUDOS)}`);
  console.log(`Terminados: ${path.join(dir, TERMINADOS)}`);
} else if (modo === 'abrir' && arg) {
  if (!fs.existsSync(arg)) {
    console.error(`No existe: ${arg}`);
    process.exit(1);
  }
  abrir(arg);
  console.log(`Abierta: ${path.resolve(arg)}`);
} else {
  console.error('Uso: node sesion.mjs nueva ["Marca o proyecto"] [--base "<carpeta>"]\n     node sesion.mjs abrir "<carpeta>"\n     node sesion.mjs limpiar "<sesión>"');
  process.exit(1);
}
