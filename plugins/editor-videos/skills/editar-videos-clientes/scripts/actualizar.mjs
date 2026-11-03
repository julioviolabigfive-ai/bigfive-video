// Mantiene el plugin al día: trae la última versión del marketplace "bigfive" y, si es más nueva que la instalada,
// actualiza el plugin. Se corre al activar la skill; si no hay internet o falla, solo avisa y la edición sigue.
//
// Uso: node actualizar.mjs
// Salida: "al día", "actualizado a X (reiniciar Claude Code)" o un aviso.
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {SKILL_DIR} from './lib.mjs';

const MARKETPLACE = 'bigfive';
const PLUGIN = 'editor-videos';

const leerVersion = (file) => {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8')).version;
  } catch {
    return null;
  }
};
const mayor = (a, b) => {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) if ((pa[i] ?? 0) !== (pb[i] ?? 0)) return (pa[i] ?? 0) > (pb[i] ?? 0);
  return false;
};
const claude = (args) =>
  spawnSync('claude', args, {encoding: 'utf8', shell: process.platform === 'win32', timeout: 120000});

const instalada = leerVersion(path.join(SKILL_DIR, '..', '..', '.claude-plugin', 'plugin.json'));
let known;
try {
  known = JSON.parse(fs.readFileSync(path.join(os.homedir(), '.claude', 'plugins', 'known_marketplaces.json'), 'utf8'))[MARKETPLACE];
} catch {}
if (!instalada || !known) {
  console.log('Actualización: el plugin no está instalado desde el marketplace "bigfive" (copia local); no se revisa.');
  process.exit(0);
}

const r = claude(['plugin', 'marketplace', 'update', MARKETPLACE]);
if (r.status !== 0) {
  console.log(`Actualización: no se pudo revisar (sin internet o sin el comando claude). Versión instalada ${instalada}.`);
  process.exit(0);
}
const disponible = leerVersion(path.join(known.installLocation, 'plugins', PLUGIN, '.claude-plugin', 'plugin.json'));
if (!disponible || !mayor(disponible, instalada)) {
  console.log(`Actualización: al día (versión ${instalada}).`);
  process.exit(0);
}
const u = claude(['plugin', 'update', `${PLUGIN}@${MARKETPLACE}`]);
if (u.status !== 0) {
  console.log(`Actualización: hay una versión nueva (${disponible}) pero no se pudo instalar. Pedir al usuario que corra /plugin update ${PLUGIN}@${MARKETPLACE}.`);
  process.exit(0);
}
console.log(`Actualización: instalada la versión ${disponible} (había ${instalada}). Se aplica al reiniciar Claude Code; esta sesión sigue con la ${instalada}.`);
