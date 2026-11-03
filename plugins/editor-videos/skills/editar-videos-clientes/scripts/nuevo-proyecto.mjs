// Crea el proyecto de edición dentro de la carpeta de la sesión, con la marca indicada.
//
// Uso: node nuevo-proyecto.mjs "<carpeta de la sesión>" --dominante "#19194D" --secundario "#2A2BA9" --acento "#FE8700"
//        [--logo "<imagen>" | --logo ninguno] [--logo-fondo "#FFFFFF"]
//        [--presentador "Nombre"] [--cargo "Cargo · Empresa"]
//        [--cierre "Agenda tu llamada" --cierre-destacado "sin costo" --cierre-boton "Haz clic debajo de este video"]
// Sin colores usa la marca BigFive. Crea <sesión>/_edicion/remotion (src y public del motor; node_modules enlazado
// al motor instalado), <sesión>/_edicion/frames y <sesión>/Terminados.
import fs from 'node:fs';
import path from 'node:path';
import {assertEngine, ENGINE_DIR, ffmpegOk, parseArgs} from './lib.mjs';

assertEngine();
const {pos, flags} = parseArgs(process.argv.slice(2));
if (!pos[0]) {
  console.error('Uso: node nuevo-proyecto.mjs "<carpeta de la sesión>" --dominante "#HEX" --secundario "#HEX" --acento "#HEX" [--logo <imagen>|ninguno]');
  process.exit(1);
}
const hex = (v, name) => {
  if (v === undefined) return undefined;
  const h = String(v).trim().replace(/^#?/, '#');
  if (!/^#[0-9a-fA-F]{6}$/.test(h)) {
    console.error(`--${name} debe ser un color HEX de 6 dígitos (por ejemplo #19194D), no "${v}".`);
    process.exit(1);
  }
  return h.toLowerCase();
};
const colores = {navy: hex(flags.dominante, 'dominante'), blue: hex(flags.secundario, 'secundario'), orange: hex(flags.acento, 'acento')};
if (flags.logo && flags.logo !== 'ninguno' && !fs.existsSync(flags.logo)) {
  console.error(`No existe el logo: ${flags.logo}`);
  process.exit(1);
}

const root = path.resolve(pos[0]);
const dest = path.join(root, '_edicion', 'remotion');
if (fs.existsSync(path.join(dest, 'src'))) {
  console.error(`Ya existe: ${dest}`);
  process.exit(1);
}
fs.mkdirSync(path.join(root, 'Terminados'), {recursive: true});
fs.mkdirSync(path.join(root, '_edicion', 'frames'), {recursive: true});
fs.mkdirSync(dest, {recursive: true});

for (const name of ['package.json', 'remotion.config.ts', 'tsconfig.json']) {
  fs.copyFileSync(path.join(ENGINE_DIR, name), path.join(dest, name));
}
fs.cpSync(path.join(ENGINE_DIR, 'src'), path.join(dest, 'src'), {recursive: true});
fs.cpSync(path.join(ENGINE_DIR, 'public'), path.join(dest, 'public'), {recursive: true});

// Un enlace en lugar de copiar ~400 MB de dependencias por proyecto (junction en Windows: no pide permisos).
fs.symlinkSync(path.join(ENGINE_DIR, 'node_modules'), path.join(dest, 'node_modules'), 'junction');

// Marca del proyecto en src/brand.ts.
const brandFile = path.join(dest, 'src', 'brand.ts');
let brand = fs.readFileSync(brandFile, 'utf8');
const set = (re, value) => {
  if (!re.test(brand)) throw new Error(`No se encontró ${re} en brand.ts`);
  brand = brand.replace(re, value);
};
for (const [k, v] of Object.entries(colores)) if (v) set(new RegExp(`(  ${k}: )"#[0-9a-fA-F]{6}"`), `$1"${v}"`);
const logoPublic = path.join(dest, 'public', 'logo.png');
if (flags.logo === 'ninguno') {
  fs.rmSync(logoPublic, {force: true});
  set(/export const LOGO: \{ file: string \| null; bg: string \} = \{ file: "logo.png"/, 'export const LOGO: { file: string | null; bg: string } = { file: null');
} else if (flags.logo) {
  // Cualquier imagen se pasa a PNG (conserva la transparencia).
  ffmpegOk(['-i', flags.logo, '-frames:v', '1', logoPublic]);
}
if (flags['logo-fondo']) set(/(\{ file: (?:"logo.png"|null), bg: )"#[0-9a-fA-F]{6}"/, `$1"${hex(flags['logo-fondo'], 'logo-fondo')}"`);
const q = (s) => JSON.stringify(String(s));
if (flags.presentador || flags.cargo) {
  set(/export const PRESENTER = \{ name: .*?, role: .*? \};/, `export const PRESENTER = { name: ${q(flags.presentador ?? '')}, role: ${q(flags.cargo ?? '')} };`);
}
if (flags.cierre) {
  set(/export const CIERRE = \{ titulo: .*? \};/,
    `export const CIERRE = { titulo: ${q(flags.cierre)}, destacado: ${q(flags['cierre-destacado'] ?? '')}, boton: ${q(flags['cierre-boton'] ?? 'Haz clic debajo de este video')} };`);
}
fs.writeFileSync(brandFile, brand);

// El texto de los paneles es blanco sobre el color dominante: avisar si es demasiado claro.
const lum = (h) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
if (colores.navy && lum(colores.navy) > 0.18) {
  console.log(`Aviso: el color dominante ${colores.navy} es claro y el texto blanco de los paneles no se va a leer bien. Usar el color más oscuro de la paleta como dominante.`);
}

console.log(`Proyecto listo: ${dest}`);
console.log(`Marca: dominante ${colores.navy ?? '(BigFive)'}, secundario ${colores.blue ?? '(BigFive)'}, acento ${colores.orange ?? '(BigFive)'}, logo ${flags.logo === 'ninguno' ? 'sin logo' : flags.logo ? 'cargado' : '(BigFive)'}`);
