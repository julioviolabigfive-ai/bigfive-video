# Editor de videos BigFive para Claude Code

> [!IMPORTANT]
> **Si vas a modificar este repo: subí la versión en cada cambio.** Las PCs del equipo se actualizan solas solo si el número sube. Cambiá el mismo número en `plugins/editor-videos/.claude-plugin/plugin.json` y en `.claude-plugin/marketplace.json`, y corré `node tools/verificar-version.mjs` antes del push. Detalle completo en [CLAUDE.md](CLAUDE.md). GitHub marca en rojo cualquier push que no lo cumpla.

Plugin con la skill `editar-videos-clientes`. Con ella Claude Code edita los videos de BigFive y de sus clientes (VSL en partes, video de confirmación y anuncios verticales) con el mismo motor y las mismas reglas que se usaron en los videos aprobados:

- cortes de silencios, muletillas y tomas repetidas, con fundidos suaves;
- subtítulos palabra por palabra;
- gráficos de marca, frases "slam" y zooms suaves;
- efectos de sonido sobrios;
- audio normalizado;
- VSL unido y portadas.

## Instalación (una vez por PC)

1. Instalar **Node.js 18 o superior**: <https://nodejs.org> (versión LTS), o en Windows:

   ```bash
   winget install OpenJS.NodeJS.LTS
   ```

2. En Claude Code, agregar el marketplace e instalar el plugin:

   ```bash
   /plugin marketplace add julioviolabigfive-ai/bigfive-video
   ```

   ```bash
   /plugin install editor-videos@bigfive
   ```

3. Pedirle a Claude: **"prepara el editor de videos"**. Ejecuta el `setup.mjs` de la skill, que descarga cerca de 2 GB y tarda entre 5 y 15 minutos. Instala:
   - Remotion;
   - el navegador de render;
   - Whisper y su modelo de transcripción;
   - los efectos de sonido.

   No hace falta Python ni ffmpeg. El instalador revisa que haya al menos 4 GB libres y elige el modelo de transcripción según la RAM: `medium` con 8 GB o más, `small` con menos.

**Requisitos:** Windows 10/11 o macOS, 8 GB de RAM recomendados e internet (la tipografía se descarga al renderizar). En Mac, además, las herramientas de compilación (`xcode-select --install`), porque Whisper se compila en la instalación.

## Uso

Basta con pedirlo en lenguaje normal, por ejemplo "quiero editar los videos de Acme" o "edita un anuncio de BigFive". Claude sigue estos pasos:

1. Crea una carpeta nueva para esta sesión en `Documentos\Edición de videos\<fecha hora> <marca>` y abre la subcarpeta `Crudos` para que pegues ahí los videos.
2. Pide la paleta de colores de la marca (dominante oscuro, secundario y acento, en HEX) y el logo, si la marca usa. Sin logo, todo se arma sin él. Sirve para cualquier marca, no solo BigFive.
3. Arma el brief creativo y el storyboard.
4. Con un cliente nuevo, entrega un **piloto** (la primera parte del VSL o un anuncio) y espera el OK.
5. Edita el resto, entrega en la subcarpeta `Terminados` (`VSL\`, `Confirmacion\`, `Anuncios\` y `Portadas\`) y la abre en el explorador.

Cada sesión tiene sus propias carpetas, así los trabajos no se mezclan. Los archivos intermedios quedan en `_edicion\`, dentro de la misma sesión. Para pedir cambios, alcanza con decirlo en lenguaje simple ("más cálido", "saca la lista del minuto 2"). Claude guarda esas preferencias en `estilo.md`, dentro de la carpeta del cliente.

## Actualizaciones

Son automáticas. Cada vez que se activa la skill, `actualizar.mjs` revisa el repo y, si hay una versión nueva, la instala. Se aplica al reiniciar Claude Code; al usarla de nuevo, el motor se actualiza solo. Sin internet, la edición sigue con la versión instalada.

Para forzarlo a mano:

```bash
/plugin marketplace update bigfive
```

```bash
/plugin update editor-videos@bigfive
```

Para publicar una versión nueva (solo quien mantiene el plugin), ver "Cambiar el estilo" más abajo: si no se sube el número de versión, las PCs no detectan el cambio.

## Cómo está armado

```
plugins/editor-videos/skills/editar-videos-clientes/
  SKILL.md                  flujo y reglas de estilo que sigue Claude
  references/
    componentes.md          props de cada gráfico del motor
    diseno.md               qué gráfico va en cada tramo (VSL, confirmación, anuncios, portadas)
    brief-creativo.md       cómo adaptar la edición a cada cliente y público
    control-calidad.md      storyboard, revisión final y devolución
  ejemplos/                 ediciones reales del VSL y de los 5 anuncios de BigFive
  scripts/
    setup.mjs               instala el motor en %USERPROFILE%\.bigfive-video
    actualizar.mjs          busca e instala versiones nuevas del plugin
    sesion.mjs              crea la carpeta de cada sesión (Crudos y Terminados), abre carpetas y libera espacio
    nuevo-proyecto.mjs      crea el proyecto de la sesión con la paleta y el logo de la marca
    transcribir.mjs         transcripción palabra por palabra
    cortar.mjs              quita silencios, muletillas y tomas, con fundidos (por tramos: memoria acotada)
    stills.mjs              fotogramas de control y portadas con un solo empaquetado
    render.mjs              render final en lote, audio normalizado y VSL unido
    finalizar.mjs           normaliza o une videos sueltos
    zonas.mjs               mide el encuadre (cabeza y pecho) para que ningún gráfico los tape
    portada.mjs             hoja de fotogramas y extracción del fotograma de portada
    hoja.mjs                une stills en una hoja de revisión
  engine/                   proyecto Remotion con los componentes de marca
    src/brand.ts            colores, logo, presentador, cierre y encuadre (lo único que cambia por marca)
    src/lib.tsx, lib2.tsx   componentes del VSL horizontal
    src/libv.tsx            componentes de anuncios verticales
    src/cover.tsx           portadas
    public/logo.png         logo de BigFive
```

### Cambiar el estilo (solo quien mantiene el plugin)

- **Marca por defecto:** `engine/src/brand.ts`.
- **Gráficos:** `engine/src/lib*.tsx`. Si agregas uno, documéntalo en `references/componentes.md`.
- **Criterio de cortes:** `scripts/cortar.mjs` (pausa máxima, márgenes, muletillas) y el paso 5 de `SKILL.md`.
- **Logo:** reemplaza `engine/public/logo.png` por el PNG original ("logo en azul"). El actual se recortó de un video.

Después de cualquier cambio, sube la versión en `plugins/editor-videos/.claude-plugin/plugin.json` y en `.claude-plugin/marketplace.json` (el mismo número). Si cambian las dependencias del motor, sube también `engine/package.json`. Corre `node tools/verificar-version.mjs` y publícalo. La regla completa está en [CLAUDE.md](CLAUDE.md). Para que el chequeo frene los commits en tu PC, actívalo una vez con `git config core.hooksPath .githooks`.

## Licencias

- **Remotion** es gratis para personas y empresas de hasta 3 empleados. Si BigFive tiene más, necesita una licencia de empresa: <https://www.remotion.dev/license>.
- **Efectos de sonido:** vienen del paquete público `hyperframes` (biblioteca de media-use, licencia de contenido de Pixabay). `setup.mjs` los descarga en cada PC; no se guardan en este repo.
