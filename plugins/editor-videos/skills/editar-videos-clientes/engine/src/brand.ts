// Configuración de marca del proyecto: lo único que cambia de una marca a otra.
// La escribe scripts/nuevo-proyecto.mjs con la paleta y el logo que da el usuario; se puede ajustar a mano.
// navy = color dominante (fondos y paneles; debe ser oscuro, el texto encima es blanco),
// blue = secundario, orange = acento (palabra activa, fondos "slam", botones).
export const C = {
  navy: "#19194d",
  blue: "#2a2ba9",
  orange: "#fe8700",
  white: "#ffffff",
  red: "#ff4d4d",
};

// Color con transparencia a partir de un HEX de 6 dígitos.
export const alpha = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

// Texto sobre el color de acento: blanco si el acento es oscuro (naranja BigFive), dominante si es claro (amarillo, celeste).
const lum = (hex: string) => {
  const ch = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
};
const acentoClaro = lum(C.orange) > 0.45;
export const SOBRE_ACENTO = acentoClaro ? C.navy : C.white;
// Palabra resaltada en el slam (fondo de acento, texto dominante): blanco si se lee, si no el secundario.
export const RESALTE_SLAM = acentoClaro ? C.blue : C.white;

// Logo en public/ (o null si la marca no usa logo: los gráficos se arman sin él).
// bg: fondo de la cajita donde va el logo (blanco si el logo es oscuro).
export const LOGO: { file: string | null; bg: string } = { file: "logo.png", bg: "#ffffff" };

export const PRESENTER = { name: "Julio Viola", role: "Director de Estrategia · BigFive" };

// Pantalla final del VSL (EndCard): llamado a la acción de esta marca.
export const CIERRE = { titulo: "Agenda tu sesión de diagnóstico", destacado: "sin costo", boton: "Haz clic debajo de este video" };

// Encuadre del presentador en los videos verticales de ESTE proyecto, en px del video final (1080x1920).
// Se mide con scripts/zonas.mjs usando el zoom máximo del video. Los gráficos NUNCA tapan cara ni pecho:
//   cabeza = borde superior de la cabeza; el gancho se ubica por encima.
//   pecho  = donde termina el pecho; tarjetas, listas, énfasis y CTA se ubican por debajo, hasta `piso`.
//   piso   = límite inferior para texto (1632 = 85%: debajo está la interfaz de Instagram/Facebook).
//   subtitulos = altura de los subtítulos.
// En horizontal, todo gráfico con texto va en panel lateral (prop `side`) que empuja el video.
export const ENCUADRE = {
  vertical: { cabeza: 330, pecho: 1250, piso: 1632, subtitulos: 1060 },
};

// Efectos de sonido (archivos en public/sfx). Sobrios: nada de pop/sparkle/glitch.
export const SFX = {
  on: true,
  master: 1,
  files: {
    click: "click-soft.mp3",
    impact: "impact-bass-1.mp3",
    whoosh: "whoosh-short.mp3",
    whooshBig: "whoosh-cinematic.mp3",
  },
  vol: { click: 0.35, impact: 0.3, whoosh: 0.28, whooshBig: 0.22 },
} as const;
