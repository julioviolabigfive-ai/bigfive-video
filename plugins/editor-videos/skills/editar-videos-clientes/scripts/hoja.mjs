// Une varias imágenes (stills de control, portadas) en una sola hoja para revisarlas de un vistazo.
// Uso: node hoja.mjs <salida.jpg> <img1> <img2> ... [--alto 432] [--columnas 3]
import {assertEngine, hojaImagenes, parseArgs} from './lib.mjs';

assertEngine();
const {pos, flags} = parseArgs(process.argv.slice(2));
const [salida, ...imgs] = pos;
if (!salida || !imgs.length) {
  console.error('Uso: node hoja.mjs <salida.jpg> <img1> <img2> ... [--alto 432] [--columnas 3]');
  process.exit(1);
}
const {cols, rows} = hojaImagenes(salida, imgs, {alto: Number(flags.alto ?? 432), columnas: Number(flags.columnas ?? 3)});
console.log(`listo: ${salida} (${cols}x${rows})`);
