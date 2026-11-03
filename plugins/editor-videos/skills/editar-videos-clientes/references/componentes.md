# Componentes del motor (src/)

Tiempos siempre en **segundos del video cortado**, obtenidos con `const at = makeFinder(words)` → `at("frase").s / .e / .i`.
Colores: `C.navy` (dominante), `C.blue` (secundario), `C.orange` (acento) — vienen de `brand.ts`.

**Regla de ubicación:** ningún gráfico tapa la cara ni el pecho. En horizontal, los gráficos con texto se usan con `side: "left" | "right"` (van en panel lateral) y cada tramo `{from, to, side}` se agrega a `panels` de `Camera` y de `Subtitles`, así el video se corre 330 px. En vertical, la ubicación sale de `brand.ts → ENCUADRE.vertical` (medido con `scripts/zonas.mjs`).

## lib.tsx — base y VSL horizontal (1920×1080)

| Componente | Props clave | Uso |
|---|---|---|
| `Camera` | `src`, `cam: {t, scale, dur?}[]`, `panels` | Video base. `dur` default 32 frames (suave). Se corre 330px cuando hay panel lateral. |
| `Subtitles` | `words`, `hide: [a,b][]`, `panels` | Subtítulos abajo, 5 palabras máx., palabra activa en acento. |
| `Slam` (dentro de `<Sequence from={f(a)}>`) | `words, startIdx, count, accent[], fontSize?` | Fondo acento + palabra por palabra. Ventana: `slamWindow(words, i, count, 0.35)`. |
| `ListPanel` | `from, to, side, title, items[{t,text,sub?,hl?}], icon: x/check/num/q, compact?` | Panel lateral de marca con lista sincronizada. `hl` resalta un ítem mientras se explica. |
| `SidePanel` | `from, to, side, sfx?, children` | Panel lateral genérico para cualquier contenido propio; agregar el tramo a `panels`. |
| `StrikeQuote` | `from, strikeAt, to, text, side` | Frase entre comillas que se tacha ("Necesito más leads"). |
| `Emphasis` | `from, to, pre?, main, side` | Frase de énfasis en panel lateral. |
| `JourneyBar` | `from, to, steps[], litAt[], bracketAt, bracketText, side` | Recorrido Anuncio → … → Llamada en columna, con corchete. |
| `Sfx` | `name: click/impact/whoosh/whooshBig, at, vol?` | Sonido suelto (ya incluido en los componentes). |

## lib2.tsx — VSL horizontal (extras)

| Componente | Props | Uso |
|---|---|---|
| `LowerThird` | `from, to, name, role, line2?, line2At?` | Cartel del presentador con logo. |
| `Bridge` | `from, to, left, right, label, side` | "Primer interés → Conversación que vale la pena". |
| `TitleCard` | `from, to, kicker, title` | Placa a pantalla completa (nombre del producto). |
| `CasePanel` | `from, to, side, name, context, stats[{t,value,prefix?,suffix?,label}], footnote?` | Caso con números que suben + aviso legal. |
| `CrmPanel` | `from, to, side, title, rows[{t,label,color,people[]}]` | Mock de pipeline/CRM ("lunes por la mañana"). |
| `TwoCards` | `from, to, cards[{t,title,body}], side` | Los dos escenarios del diagnóstico, apilados en el panel. |
| `CtaBar` | `from, to, text, sub?, side` | Botón de acción con flecha, en el panel. |
| `EndCard` | `from, to` | Pantalla final con logo (extender la composición ~3,5 s y envolver `Camera` en `<Sequence durationInFrames={f(dur)}>`). |

## libv.tsx — anuncios verticales (1080×1920)

| Componente | Props | Uso |
|---|---|---|
| `CameraV` | `src, cam` | Zoom suave (default 40 frames). |
| `SubtitlesV` | `words, hide` | Grandes (74px), a la altura del pecho (`SUB_Y`). |
| `HookTitle` | `from, to, pre?, main` | Gancho apoyado justo encima de `ENCUADRE.vertical.cabeza`. Máximo 2 líneas: si no entra, acortar. |
| `ListCardV` | `from, to, title?, items, icon` | Tarjeta con lista entre `pecho` y `piso`; se achica sola si no entra (más de 4 ítems: dividir en dos). |
| `StrikeV`, `EmphasisV` | igual que horizontales, sin `side` | Entre `pecho` y `piso`. |
| `ChipsV` | `from, to, title?, chips[{t,text}], connected?` | Fichas (herramientas) o etapas conectadas con flechas. |
| `CtaV` | `from, to, text, sub?` | Botón final "Mira el video". |
| Slam | usar `Slam` de lib con `fontSize` 100–124 | |

## cover.tsx — portadas

`Cover` con props `{ bg, headline, accent?, kicker?, play?, shiftX? }`. Detecta la orientación por el tamaño del `<Still>`:
- Horizontal: presentador a la derecha (`shiftX` default 330), degradado del color dominante a la izquierda, logo, kicker, titular 104px, play.
- Vertical: logo arriba, titular abajo sobre degradado (zona visible en la grilla 4:5 de Instagram), cara libre.
