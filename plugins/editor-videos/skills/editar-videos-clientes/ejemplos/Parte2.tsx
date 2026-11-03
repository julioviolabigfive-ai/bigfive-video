import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import data from "./p2_words.json";
import { Camera, Emphasis, f, ListPanel, makeFinder, Panel, Slam, slamWindow, Subtitles, Word } from "./lib";
import { Bridge, LowerThird } from "./lib2";

const words = data.words as Word[];
const at = makeFinder(words);
export const P2_DURATION = Math.ceil(data.duration * 25);
const END = data.duration + 0.2;

const s1 = at("más leads no solucionan");
const [s1A, s1B] = slamWindow(words, s1.i, 8, 0.35);
const emp1 = at("Y el lead es").s, bridge = at("Lo importante es todo").s, eso = at("Y eso es lo que quiero").s;
const nombre = at("Mi nombre").s;
const emp2 = at("Muchas empresas").s, emp2To = at("Porque cuando empiezas").s;
const s2 = at("una mala llamada rara");
const [s2A, s2B] = slamWindow(words, s2.i, 9, 0.35);
const pA = { from: s2B - 0.05, to: at("Y después ves").s - 0.1, side: "right" as const };
const pB = { from: at("Y después ves").s, to: at("Y ahí es donde").s - 0.05, side: "left" as const };
const panels: Panel[] = [pA, pB];

const cam = [
  { t: 0, scale: 1.0 },
  { t: s1B, scale: 1.06, dur: 30 },
  { t: eso, scale: 1.14, dur: 30 },
  { t: nombre, scale: 1.04, dur: 30 },
  { t: emp2, scale: 1.12, dur: 30 },
  { t: emp2To, scale: 1.04, dur: 30 },
  { t: at("Empiezan mucho antes").s, scale: 1.18, dur: 30 },
  { t: s2A, scale: 1.0, dur: 30 },
  { t: at("Y ahí es donde").s, scale: 1.16, dur: 30 },
];

export const Parte2: React.FC = () => (
  <AbsoluteFill>
    <Camera src="p2_cut.mp4" cam={cam} panels={panels} />

    <Emphasis from={emp1} to={bridge - 0.05} pre="El lead es el inicio del proceso," main="no el resultado final." />
    <Bridge from={bridge} to={eso - 0.05} left="Primer interés" right="Conversación que vale la pena" label="Lo importante pasa aquí" />
    <LowerThird from={nombre} to={at("Y después de analizar").s + 0.6} name="Julio Viola" role="Director de Estrategia · BigFive"
      line2="Más de 5 años en ventas, marketing y adquisición en Latinoamérica" line2At={at("cinco años").s} />
    <Emphasis from={emp2} to={emp2To - 0.05} pre="Generar leads" main="≠ generar buenas oportunidades" />

    <ListPanel {...pA} icon="num" title="Dónde empieza una mala llamada" items={[
      { t: at("Empieza cuando tu anuncio").s, text: "Tu anuncio atrae a quien no tiene intención" },
      { t: at("Cuando el mensaje").s, text: "El mensaje despierta curiosidad, no necesidad" },
      { t: at("Cuando cualquier persona").s, text: "Cualquiera llega a tu calendario sin filtro" },
    ]} />
    <ListPanel {...pB} icon="x" title="Y después, las consecuencias" items={[
      { t: at("Personas que agendan").s, text: "Agendan y no aparecen" },
      { t: at("Prospectos que llegan").s, text: "Llegan sin entender qué resuelves" },
      { t: at("nunca hubo presupuesto").s, text: "Sin presupuesto, urgencia ni encaje" },
    ]} />

    <Subtitles words={words} panels={panels} hide={[
      [s1A, s1B], [emp1 - 0.05, eso], [emp2 - 0.05, emp2To], [s2A, s2B],
    ]} />

    <Sequence from={f(s1A)} durationInFrames={f(s1B) - f(s1A)}>
      <Slam words={words} startIdx={s1.i} count={8} accent={["calidad."]} />
    </Sequence>
    <Sequence from={f(s2A)} durationInFrames={f(s2B) - f(s2A)}>
      <Slam words={words} startIdx={s2.i} count={9} accent={["rara", "vez"]} />
    </Sequence>
  </AbsoluteFill>
);
export { END as P2_END };
