// Fotogramas de control y portadas con UN solo empaquetado y un solo navegador (mucho más rápido que un
// `npx remotion still` por fotograma, que reempaqueta y copia los videos cada vez).
//
// Control:  node stills.mjs "<proyecto>" <Comp> <seg1> <seg2> ... [--hoja "<hoja.jpg>"] [--escala 0.4] [--columnas 4]
//   Guarda <proyecto>/../frames/<Comp>_<seg>.jpg y, con --hoja, los une en una sola imagen para revisar.
// Portadas: node stills.mjs "<proyecto>" --portadas "<carpeta>"
//   Renderiza todas las composiciones <Still> cuyo id empieza con "Portada" como PNG en <carpeta>
//   ("PortadaAnuncio04" → "Portada Anuncio04.png").
import fs from 'node:fs';
import path from 'node:path';
import {assertEngine, empaquetar, engineRequire, hojaImagenes, mantenerTemporalesLimpios, parseArgs} from './lib.mjs';

assertEngine();
mantenerTemporalesLimpios();
const {pos, flags} = parseArgs(process.argv.slice(2));
const [proyectoArg, comp, ...segs] = pos;
if (!proyectoArg || (!flags.portadas && (!comp || !segs.length))) {
  console.error('Uso: node stills.mjs "<proyecto>" <Comp> <seg1> <seg2> ... [--hoja "<hoja.jpg>"] [--escala 0.4]\n     node stills.mjs "<proyecto>" --portadas "<carpeta>"');
  process.exit(1);
}
const proyecto = path.resolve(proyectoArg);
// Remotion busca su navegador desde la carpeta actual: el proyecto enlaza a los node_modules del motor, donde ya está.
process.chdir(proyecto);
const {getCompositions, selectComposition, renderStill, openBrowser} = engineRequire()('@remotion/renderer');
const serveUrl = await empaquetar(proyecto);
const browser = await openBrowser('chrome');

try {
  if (flags.portadas) {
    const dir = path.resolve(flags.portadas);
    fs.mkdirSync(dir, {recursive: true});
    const portadas = (await getCompositions(serveUrl, {inputProps: {}, puppeteerInstance: browser})).filter((c) => c.id.startsWith('Portada'));
    for (const composition of portadas) {
      const out = path.join(dir, `${composition.id.replace(/^Portada/, 'Portada ').replace(/\s+/g, ' ').trim()}.png`);
      await renderStill({serveUrl, composition, output: out, imageFormat: 'png', inputProps: {}, puppeteerInstance: browser});
      console.log(`listo: ${out}`);
    }
  } else {
    const composition = await selectComposition({serveUrl, id: comp, inputProps: {}, puppeteerInstance: browser});
    const dir = path.join(proyecto, '..', 'frames');
    fs.mkdirSync(dir, {recursive: true});
    const outs = [];
    for (const s of segs) {
      const frame = Math.min(composition.durationInFrames - 1, Math.round(Number(s) * composition.fps));
      const out = path.join(dir, `${comp}_${String(s).replace('.', ',')}.jpg`);
      await renderStill({
        serveUrl, composition, frame, output: out, imageFormat: 'jpeg', jpegQuality: 85,
        scale: Number(flags.escala ?? 0.4), inputProps: {}, puppeteerInstance: browser,
      });
      outs.push(out);
    }
    console.log(`${outs.length} fotogramas en ${dir}`);
    if (flags.hoja) {
      const vertical = composition.height > composition.width;
      hojaImagenes(path.resolve(flags.hoja), outs, {alto: vertical ? 480 : 270, columnas: Number(flags.columnas ?? (vertical ? 6 : 4))});
      console.log(`hoja: ${path.resolve(flags.hoja)}`);
    }
  }
} finally {
  await browser.close({silent: true});
}
