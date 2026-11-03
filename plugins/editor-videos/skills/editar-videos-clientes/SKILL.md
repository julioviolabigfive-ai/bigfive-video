---
name: editar-videos-clientes
description: Edita de punta a punta videos de cualquier marca, de BigFive o de sus clientes (VSL en partes, video de confirmación y anuncios verticales), con el motor Remotion propio y la paleta y el logo de cada marca — corte de silencios, muletillas y tomas repetidas con fundidos suaves, subtítulos palabra por palabra, motion graphics de marca, frases "slam", zooms suaves, efectos de sonido sobrios, audio normalizado, VSL unido y portadas. Usar cuando pidan editar un VSL, un video de confirmación, anuncios, "los videos de un cliente" o "editar como los anteriores", o pasen una carpeta con partes de video y un guion o funnel.
---

# Editar videos de clientes (VSL · Confirmación · Anuncios · Portadas)

Objetivo: entregar **100% terminado**: videos editados con sonido, VSL unido, anuncios y portadas, con el estilo que BigFive ya aprobó y los colores y el logo de la marca de cada video. El motor es Remotion (`engine/` de esta skill) y es el estilo validado; no usar HyperFrames ni otras skills de video para esto.

En los comandos, `<skill>` es la carpeta base de esta skill, `<sesión>` es la carpeta de la sesión que crea `sesion.mjs` y `<proyecto>` es `<sesión>\_edicion\remotion`.

## Lo primero al activar la skill

1. **Abrir la carpeta de crudos de esta sesión**, antes de cualquier otra cosa: `node "<skill>/scripts/sesion.mjs" nueva "<marca o proyecto>"`. Crea una carpeta nueva por sesión en `Documentos\Edición de videos\<fecha hora> <marca>` con `Crudos` y `Terminados`, y abre `Crudos` en el explorador. Decirle al usuario la ruta y pedirle que pegue ahí los videos crudos (y el guion, si hay). Nunca reutilizar la carpeta de otra sesión. Si el usuario ya indicó otra carpeta con los videos, crear igual la sesión y copiarlos a `Crudos`.
2. **Pedir la marca** en el mismo mensaje, si no la dio: la paleta de colores en HEX (dominante oscuro, secundario y acento) y el logo, si la marca usa logo. Si no hay logo, todo se hace sin él. No asumir los colores ni el logo de BigFive para otra marca.
3. Mientras el usuario pega los videos, **buscar actualizaciones**: `node "<skill>/scripts/actualizar.mjs"`. Si instala una versión nueva, avisar que se aplica al reiniciar Claude Code (esta sesión sigue con la actual) y, al reiniciar, el paso 0 actualiza el motor.
4. Esperar a que el usuario confirme que pegó los videos antes de seguir.

## Rutas y herramientas

- Componentes del motor: `<skill>/engine/src` (`lib.tsx`, `lib2.tsx`, `libv.tsx`, `cover.tsx`, `brand.ts`). Cada proyecto recibe una copia en `<proyecto>\src`.
- Ediciones reales de BigFive para copiar patrones: `<skill>/ejemplos` (`Parte1`–`Parte5.tsx` = VSL horizontal; `Anuncios.tsx` = 5 anuncios verticales). Leer el ejemplo más parecido antes de componer.
- Referencias: `references/componentes.md` (props de cada componente), `references/diseno.md` (qué gráfico va en cada tramo), `references/brief-creativo.md` y `references/control-calidad.md`.
- Scripts: `node "<skill>/scripts/<script>.mjs"`. Usan el ffmpeg y el Whisper que instala `setup.mjs`; no hace falta Python ni ffmpeg en el PATH.

## 0. Primera vez en esta PC

Comprobar si existe `%USERPROFILE%\.bigfive-video\engine-<versión>\node_modules\remotion`, donde `<versión>` es el campo `version` de `<skill>/engine/package.json`. Si no existe:

1. Verificar Node.js 18 o superior (`node --version`). Si falta, pedir permiso para instalarlo con `winget install OpenJS.NodeJS.LTS` (en Mac: `brew install node`) y pedir que reinicie Claude Code.
2. Ejecutar `node "<skill>/scripts/setup.mjs"` en segundo plano. Descarga cerca de 2 GB (Remotion, navegador de render, Whisper, modelo de transcripción y efectos de sonido) y tarda entre 5 y 15 minutos la primera vez. Revisa el espacio en disco, elige el modelo según la RAM (`medium` con 8 GB o más, `small` con menos) y borra versiones viejas del motor.

Si la versión del motor cambió (por una actualización del plugin), la carpeta `engine-<versión>` no existe y este paso se repite solo.

## Entradas (pedir solo lo que falte)

1. Videos crudos en `<sesión>\Crudos` (partes del VSL numeradas en orden, confirmación, anuncios).
2. Paleta HEX de 6 dígitos (dominante, secundario, acento) y logo si hay. El dominante va de fondo con texto blanco, así que tiene que ser oscuro; si la paleta no tiene un color oscuro, proponer uno y confirmarlo.
3. Nombre y cargo del presentador (cartel de presentación) y el llamado a la acción del cierre del VSL. Sin esos datos no usar `LowerThird` ni `EndCard`.
4. Guion o funnel (PDF o doc) y **cuál versión** es la correcta.
5. Casos y números documentados. Solo esos pueden aparecer en pantalla.

## Flujo

1. **Proyecto con la marca:** `node "<skill>/scripts/nuevo-proyecto.mjs" "<sesión>" --dominante "#HEX" --secundario "#HEX" --acento "#HEX" --logo "<imagen>"` (o `--logo ninguno`), más `--presentador`, `--cargo` y `--cierre`, `--cierre-destacado` y `--cierre-boton` si hay VSL. Escribe `<proyecto>\src\brand.ts` y copia el logo. El logo va sobre una cajita blanca; si el logo es blanco o claro, usar `--logo-fondo` con el color dominante. Si el script avisa que el dominante es claro, corregir la paleta con el usuario. Sin colores, el proyecto queda con la marca BigFive (solo para videos de BigFive).
2. **Brief creativo (antes de editar):** seguir `references/brief-creativo.md`. Definir quién narra, a quién le habla y qué debe sentir, y traducirlo a decisiones visuales. La edición debe notarse hecha para ese cliente y ese público.
3. **Leer el guion completo** (la versión correcta) y el funnel: objetivo de cada video, tesis centrales, CTA, casos y avisos legales. Identificar las 1–2 frases más fuertes por parte (candidatas a "slam").
4. **Transcribir** cada video: `node "<skill>/scripts/transcribir.mjs" "<video>" "<carpeta del cliente>\_edicion\<id>_words.json"`. Correr en segundo plano y **nunca en paralelo con un render**: Whisper usa todos los núcleos y el render se vuelve entre 5 y 10 veces más lento (o falla). Lanzar transcripciones y renders siempre de a uno.
5. **Revisar la transcripción contra el guion.** Localizar tomas repetidas, frases falsas y muletillas de contexto ("este", "o sea", "bueno") y borrarlas con `--borrar "inicio-fin;..."` en segundos del video original. Whisper puede omitir muletillas, así que comparar también contra el audio y los huecos entre palabras. Corregir con `--fix "Mal=Bien;..."`: nombres propios (Cova→Coba, Grey→Grace, BSL→VSL), puntuación inventada (preguntas que no lo son) y números. Si una parte **repite el final de la anterior**, usar `--desde "frase de inicio real"`.
6. **Cortar silencios y muletillas, con cortes suaves** (fundido de 0,12 s por defecto): `node "<skill>/scripts/cortar.mjs" --video "<mp4>" --palabras "<json>" --id p1 --remotion "<proyecto>" [--fix ...] [--borrar ...] [--desde ...]`. Genera `public\p1_cut.mp4` y `src\p1_words.json` (con los números ya unidos: "45.000"). Trabaja por tramos, así que sirve para un VSL entero en un solo archivo sin agotar la memoria; igual conviene dividir un VSL largo en partes de 1–3 minutos (con `--desde` y `--borrar`) para componer, revisar y corregir por partes.
7. **Medir el encuadre (verticales):** `node "<skill>/scripts/zonas.mjs" "<video>" "..\frames\zonas.jpg" --zoom <zoom máximo que vas a usar>`. Leer en la regla dónde empieza la cabeza y dónde termina el pecho, y cargarlo en `brand.ts → ENCUADRE.vertical` (`cabeza`, `pecho`). El motor ubica el gancho por encima de `cabeza` y las tarjetas, listas, énfasis y CTA entre `pecho` y `piso`. Si una tarjeta no entra, la achica sola; si queda muy chica, dividirla en dos. Mientras está el gancho, no pasar del zoom con el que se midió `cabeza`.
8. **Componer** cada video en `<proyecto>\src\` copiando el patrón de `<skill>/ejemplos`. Sincronizar todo con `makeFinder(words)` y `at("frase exacta")`. Registrar cada composición en `Root.tsx`: VSL y confirmación 1920×1080, anuncios 1080×1920, fps 25.
9. **Validar con stills**, todos en un solo comando (empaqueta una vez): `node "<skill>/scripts/stills.mjs" "<proyecto>" <Comp> <seg1> <seg2> ... --hoja "<sesión>\_edicion\frames\hoja_<Comp>.jpg"`, con un segundo por **cada** gráfico. Las frases de `at()` que no existen fallan acá. Revisar la hoja: **ningún gráfico tapa la cara ni el pecho**, textos dentro de la zona segura, subtítulos legibles, sin solapamientos. No usar `npx remotion still` uno por uno: reempaqueta y copia los videos cada vez.
10. **Render final**, todo en un solo comando y en segundo plano: `node "<skill>/scripts/render.mjs" "<proyecto>" "VslParte1=<sesión>\Terminados\VSL\Parte 1.mp4" "VslParte2=<sesión>\Terminados\VSL\Parte 2.mp4" ... --unir "<sesión>\Terminados\VSL\VSL COMPLETO.mp4"`. Empaqueta una vez y entrega cada video con el audio normalizado (−16 LUFS horizontal, −14 LUFS vertical). Los anuncios van en otra llamada sin `--unir`. Para revisar rápido antes del final: `--borrador` (media resolución, a `_edicion\`, nunca a `Terminados`).
11. **Portadas** (siempre):
    1. `node "<skill>/scripts/portada.mjs" hoja <video> hoja.jpg --n 12`.
    2. Elegir un fotograma con **sonrisa** o con expresión y movimiento (gesto con las manos, cejas arriba, energía), mirada a cámara. **Nunca** cara seria o neutra, ojos entrecerrados, boca a medio abrir ni muecas de mitad de palabra. Si en la hoja no hay ninguno así, generar otra con `--n 24` o acotar con `--desde`/`--hasta` alrededor de los momentos con sonrisa; si aun así no aparece, avisar al usuario en vez de usar uno serio.
    3. `portada.mjs sacar <video> "<proyecto>\public\portada_x.jpg" --t <seg>`.
    4. Crear un `<Still>` por portada en `Root.tsx` con `defaultProps`: `headline` es la tesis o el gancho del video y `accent` es una palabra clave.
    5. Renderizar todas juntas: `node "<skill>/scripts/stills.mjs" "<proyecto>" --portadas "<sesión>\Terminados\Portadas"`. El VSL lleva portada horizontal con play; los anuncios, vertical con `play: false`. Revisar cada PNG.
12. **Entrega** en `<sesión>\Terminados\`: `VSL\` (partes y COMPLETO), `Confirmacion\`, `Anuncios\` y `Portadas\`. Resumir para el usuario:
    - la duración de cada video;
    - qué se corrigió (repeticiones, nombres);
    - **qué textos en pantalla son paráfrasis propias**, para que el usuario los revise.
13. **Abrir la carpeta de terminados**, siempre: `node "<skill>/scripts/sesion.mjs" abrir "<sesión>\Terminados"`, y dar la ruta en el resumen. Lo mismo al entregar el piloto.
14. **Liberar espacio** al cerrar la entrega: `node "<skill>/scripts/sesion.mjs" limpiar "<sesión>"` borra el empaquetado y los renders intermedios (se regeneran solos si hay correcciones).

**Piloto obligatorio con cada cliente nuevo:** renderizar la primera parte del VSL (o un anuncio si no hay VSL), entregarla con el brief creativo y el storyboard, y esperar el OK antes de hacer el resto. Con el estilo ya aprobado (por ejemplo, videos de BigFive), entregar todo terminado.

## Trabajar como editor profesional

- **Look desde referencias:** si hay videos aprobados o referencias, pedir los archivos, analizar fotogramas y transcripción, y resumir el look en `<carpeta del cliente>\estilo.md`: qué tomar y qué no. Nunca copiar la marca de la referencia.
- **Memoria de estilo:** leer `estilo.md` antes de editar y actualizarlo con cada corrección.
- **Storyboard:** armarlo antes del piloto.
- **Revisión y devolución:** seguir siempre `references/control-calidad.md` antes de entregar.
- **Criterio:** decidir como editor, pero no cambiar el mensaje. Ante algo ambiguo que afecte claims, marca o guion, preguntar.

## Reglas de estilo (aprobadas por BigFive, no negociables)

- **Ningún gráfico tapa la cara ni el pecho del presentador**, nunca. En vertical, medir el encuadre (paso 7) y dejar que el motor ubique cada gráfico en las zonas libres. En horizontal, todo gráfico con texto (`Emphasis`, `StrikeQuote`, `JourneyBar`, `Bridge`, `TwoCards`, `CtaBar`, listas, casos) va en panel lateral con `side`, y su tramo se agrega a `panels` de `Camera` para que el video se corra; las placas a pantalla completa (slam, `TitleCard`, `EndCard`) reemplazan la imagen y no tapan nada. El cartel `LowerThird` va abajo a la izquierda: verificar en el still que no toque el cuerpo.
- Tono **serio y premium**: los clientes son consultores y empresas. Nada de estética de reel ni de caricatura.
- **Todo movimiento es suave**: zooms de 30 frames o más con easing in-out, paneles con desplazamiento lento, frases slam con fundido y cortes con fundido corto. Nunca punch-in ni corte seco.
- **La edición responde al brief creativo**, no a una plantilla: el motor es la base, no el look final.
- **Sonidos sobrios** (`brand.ts → SFX`): clic suave en ítems y palabras, golpe grave solo en la primera palabra del slam, whoosh corto en paneles y whoosh cinemático en títulos y pantalla final. Prohibido pop, sparkle, glitch o ping. Volúmenes bajos, debajo de la voz.
- **Slam** (fondo de acento, palabra por palabra): 1–2 por parte del VSL y 1 por anuncio, solo en la tesis más fuerte.
- Un cambio visual cada 6–10 s; no recargar.
- Subtítulos siempre (en anuncios son críticos), con la palabra activa en color de acento. Ocultarlos solo cuando el gráfico repite textualmente lo que se dice o durante el slam.
- Respetar el guion: no inventar cifras, promesas ni resultados. Las tarjetas de casos llevan el aviso "Resultado de un proyecto específico. No representa una garantía."
- Anuncios: gráficos debajo del pecho (zona medida); nada de texto en el 15% inferior (UI de Instagram y Facebook); gancho arriba de la cabeza los primeros segundos; cierre con botón "Mira el video".

## Problemas conocidos (ya resueltos, no repetir)

- `Set-Content -Encoding utf8` de PowerShell agrega BOM y deja el JSON inválido. Usar la herramienta Write o `[IO.File]::WriteAllText`.
- Las portadas se definen con `defaultProps` en `Root.tsx` (pasar props por archivo falla con rutas que tienen "Ó").
- Whisper separa números ("45" ".000"); `cortar.mjs` los une. Las frases de `at()` deben escribirse como quedan en el JSON cortado.
- `at()` lanza "Frase no encontrada" si la frase no coincide token a token (se ignoran acentos y signos). Revisar el JSON cortado antes de componer.
- Whisper puede alargar una palabra hasta cubrir la pausa siguiente; `transcribir.mjs` ajusta los bordes con los silencios reales del audio.
- **Tiempos de referencia** (Ryzen 7 de 8 núcleos): la transcripción tarda alrededor de 1,4 veces la duración del video, el render unos 2,3 s por segundo de video (un VSL de 8 min, unos 20 min) y una hoja de 10 stills unos 20 s. En otras PCs escala con el procesador: avisar al usuario el tiempo estimado antes de un render largo. Si tarda mucho más, revisar que no haya otra transcripción o render corriendo y, en notebooks, que esté enchufada y en modo de alto rendimiento (con batería o caliente puede rendir la mitad). `render.mjs` usa la cantidad de fotogramas en paralelo que midió `calibrar.mjs` en esta PC; si se cambia de equipo o de hardware, `setup.mjs` vuelve a medir. Más hilos, GPU (`--gl=angle`) o presets del codificador no mejoran: el tiempo está en dibujar cada fotograma.
- **"El motor no está instalado"**: ejecutar el paso 0.
- **El render falla al cargar la fuente**: Remotion descarga Inter de Google Fonts al renderizar, así que hace falta internet.
