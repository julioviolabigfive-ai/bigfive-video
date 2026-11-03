# Qué gráfico va en cada momento

Principio: la edición tiene que **empujar a agendar**. Cada gráfico refuerza lo que el prospecto debe sentir en ese tramo; si no suma a eso, no va.

## VSL (horizontal, en partes)

| Tramo del guion | Qué debe sentir | Gráficos |
|---|---|---|
| Gancho / síntomas | "Esto me pasa a mí" | `ListPanel` icon `x` con cada síntoma al decirlo; zoom suave en la frase que cierra el gancho; **slam** con la pregunta central. |
| Frase que el prospecto piensa ("necesito más leads") | Reconocerse | `StrikeQuote` y se tacha cuando el presentador la desarma. |
| Contraste (referido vs. lead frío, buen vs. mal prospecto) | "El problema no es mi servicio" | Panel `check` del lado opuesto al panel de síntomas. |
| Presentación del experto | Confianza | `LowerThird` con cargo y años de experiencia (solo datos documentados). |
| Dónde nace el problema | Entender la causa | `JourneyBar`, `ListPanel` icon `num`, `Bridge`. |
| Mecanismo / producto | "Esto es un sistema" | `TitleCard` con el nombre del producto; `ListPanel num` de las etapas con `hl` mientras se explica cada una. |
| Fases de implementación | Claridad del proceso | `ListPanel num` con `sub`. |
| Prueba social | "Funciona" | `CasePanel` por caso alternando lados, números que suben, aviso legal. Slam con la conclusión ("mejores llamadas"). |
| Futuro deseado | Desearlo | `CrmPanel` (pipeline del lunes), luego `ListPanel` "Sabes dónde mirar". |
| CTA / sesión | Agendar sin miedo | `CtaBar` al primer llamado, `ListPanel` de qué se revisa y requisitos (filtra), `TwoCards` con los dos escenarios, `Emphasis` "Primero diagnóstico, después decisión", slam de cierre, `CtaBar` final + `EndCard`. |

## Video de confirmación (horizontal)

Objetivo: **que asista** y llegue preparado. Ritmo más calmo, 1 slam como máximo.
- Apertura: `Emphasis` "Tu sesión ya está agendada" + aviso de no cerrar la página.
- Qué NO es la llamada (no es demo ni venta) → `StrikeQuote` ("una llamada de ventas").
- Qué vamos a revisar → `ListPanel num` (captación, calificación, agenda, seguimiento, pipeline) o las preguntas del guion con icon `q`.
- Costo de no resolverlo → `ListPanel x`.
- Los dos escenarios → `TwoCards`.
- Pasos logísticos (confirmar asistencia, agregar al calendario, lugar tranquilo, invitar a quien decide, reprogramar) → `ListPanel check` + `CtaBar` "Confirma tu asistencia".
- Cierre → `EndCard` adaptada o `CtaBar` "Nos vemos en la sesión".

## Anuncios (vertical 9:16, 30–50 s)

- 0–3 s: `HookTitle` con el gancho (pregunta o dolor) arriba de la cabeza; zoom suave continuo de entrada.
- Desarrollo: 2–4 gráficos inferiores (`ListCardV`, `StrikeV`, `EmphasisV`, `ChipsV`), uno a la vez.
- 1 slam con la tesis del anuncio.
- Cierre: `EmphasisV` con el producto + `CtaV` "Mira el video".
- Zona segura: gancho encima de la cabeza y gráficos entre el pecho y y=1632 (medir con `scripts/zonas.mjs`); nada en el 15% inferior ni pegado al borde derecho (íconos). Ningún gráfico tapa cara ni pecho.

## Portadas

- Titular = la tesis más fuerte del video (VSL) o la frase central/gancho (anuncio), máx. ~8 palabras, 1 palabra en acento.
- Fotograma: **sonrisa** o momento de expresión que transmita movimiento (gesto, energía), mirada a cámara, sin manos tapando la cara, sin desenfoque. Evitar siempre caras serias o neutras, ojos entrecerrados, bocas a medio abrir y muecas de mitad de palabra.
- VSL: con play. Anuncios: sin play. Revisar siempre el PNG final antes de entregar.
