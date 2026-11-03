// Verifica la regla de versiones del plugin. Sin esto, las PCs del equipo no detectan los cambios.
//
// Uso: node tools/verificar-version.mjs [<commit base>]
//   Sin base compara lo que está por commitear (staged) con HEAD; con base, compara HEAD con esa base.
// Falla (código 1) si:
//   - plugin.json y marketplace.json tienen versiones distintas;
//   - cambió algo en plugins/ y la versión no subió;
//   - cambiaron las dependencias del motor (engine/package.json o package-lock.json) y engine/package.json no subió su versión.
import {execSync} from 'node:child_process';
import fs from 'node:fs';

const PLUGIN = 'plugins/editor-videos/.claude-plugin/plugin.json';
const MARKET = '.claude-plugin/marketplace.json';
const ENGINE = 'plugins/editor-videos/skills/editar-videos-clientes/engine/package.json';
const LOCK = 'plugins/editor-videos/skills/editar-videos-clientes/engine/package-lock.json';

const git = (cmd) => execSync(`git ${cmd}`, {encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore']}).trim();
const base = process.argv[2];
const enBase = (file) => {
  try {
    return git(`show ${base ?? 'HEAD'}:${file}`);
  } catch {
    return null; // archivo nuevo o primer commit
  }
};
const ahora = (file) => (base ? git(`show HEAD:${file}`) : fs.readFileSync(file, 'utf8'));
const version = (json) => (json ? JSON.parse(json).version : null);
const mayor = (a, b) => {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) if (pa[i] !== pb[i]) return pa[i] > pb[i];
  return false;
};

const errores = [];
const vPlugin = version(ahora(PLUGIN));
const vMarket = JSON.parse(ahora(MARKET)).plugins.find((p) => p.name === 'editor-videos')?.version;
if (vPlugin !== vMarket) errores.push(`plugin.json dice ${vPlugin} y marketplace.json dice ${vMarket}: tienen que ser iguales.`);

let cambiados;
try {
  cambiados = (base ? git(`diff --name-only ${base} HEAD`) : git('diff --cached --name-only')).split('\n').filter(Boolean);
} catch {
  cambiados = [];
}
const vAntes = version(enBase(PLUGIN));
if (cambiados.some((f) => f.startsWith('plugins/')) && vAntes && !mayor(vPlugin, vAntes)) {
  errores.push(`Cambiaste archivos del plugin pero la versión sigue en ${vPlugin}. Súbela (por ejemplo a ${vAntes.replace(/\d+$/, (n) => Number(n) + 1)}) en ${PLUGIN} y en ${MARKET}.`);
}
const eAntes = version(enBase(ENGINE));
const eAhora = version(ahora(ENGINE));
const depsCambiaron = cambiados.includes(LOCK) || (cambiados.includes(ENGINE) && JSON.stringify(JSON.parse(enBase(ENGINE) ?? '{}').dependencies) !== JSON.stringify(JSON.parse(ahora(ENGINE)).dependencies));
if (depsCambiaron && eAntes && !mayor(eAhora, eAntes)) {
  errores.push(`Cambiaron las dependencias del motor pero ${ENGINE} sigue en ${eAhora}. Súbela para que cada PC reinstale el motor.`);
}

if (errores.length) {
  console.error('\n✖ Regla de versiones (ver CLAUDE.md):\n  - ' + errores.join('\n  - ') + '\n');
  process.exit(1);
}
console.log(`✔ Versiones correctas (plugin ${vPlugin}, motor ${eAhora}).`);
