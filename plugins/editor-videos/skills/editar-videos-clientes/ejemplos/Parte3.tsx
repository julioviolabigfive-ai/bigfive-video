import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import data from "./p3_words.json";
import { Camera, Emphasis, f, ListPanel, makeFinder, Panel, Slam, slamWindow, StrikeQuote, Subtitles, Word } from "./lib";
import { Bridge, TitleCard } from "./lib2";

const words = data.words as Word[];
const at = makeFinder(words);
const nx = (phrase: string, k: number) => words[at(phrase).i + k].s;
export const P3_DURATION = Math.ceil(data.duration * 25);
const END = data.duration + 0.2;

const pA = { from: 0.3, to: at("Pero entonces llega").s - 0.1, side: "right" as const };
const pB = { from: at("Pero entonces llega").s, to: at("Entonces aparece").s - 0.05, side: "left" as const };
const sl = at("Quizá el problema no sea");
const [slA, slB] = slamWindow(words, sl.i, 7, 0.35);
const emp1 = at("Quizá sea todo").s;
const pC = { from: at("Y ahí captar").s, to: at("Porque si esas piezas").s - 0.05, side: "right" as const };
const emp2 = at("Porque si esas piezas").s;
const title = at("por eso creamos").s, titleTo = at("No para ayudarte").s - 0.05;
const strikeFrom = at("No para ayudarte").s, strikeAt = at("sino para trabajar").s;
const bridgeFrom = strikeAt + 0.8, bridgeTo = at("El sistema conecta").s - 0.05;
const pD = { from: at("El sistema conecta").s, to: at("Porque si solo resolvemos").s - 0.05, side: "right" as const };
const pE = { from: at("Porque si solo resolvemos").s, to: at("Por eso Pipeline First no").s - 0.05, side: "left" as const };
const emp3 = at("Por eso Pipeline First no").s;
const panels: Panel[] = [pA, pB, pC, pD, pE];

const hl = {
  capt: at("Primero necesitamos atraer").s, cal: at("Después identificar").s,
  ag: at("Conseguir que lleguen").s, seg: at("Y si todavía").s, end: pD.to,
};

const cam = [
  { t: 0, scale: 1.0 },
  { t: at("Entonces aparece").s, scale: 1.14, dur: 30 },
  { t: slB, scale: 1.05, dur: 30 },
  { t: emp2, scale: 1.12, dur: 30 },
  { t: titleTo, scale: 1.04, dur: 30 },
  { t: pE.to, scale: 1.12, dur: 30 },
];

export const Parte3: React.FC = () => (
  <AbsoluteFill>
    <Camera src="p3_cut.mp4" cam={cam} panels={panels} />

    <ListPanel {...pA} icon="q" title="Lo que sueles culpar" items={[
      { t: at("tu vendedor").s, text: "Tu vendedor" },
      { t: at("tu precio").s, text: "Tu precio" },
      { t: at("tu oferta").s, text: "Tu oferta" },
      { t: at("más volumen").s, text: "La falta de volumen" },
    ]} />
    <ListPanel {...pB} icon="check" title="Cuando llega un buen prospecto" items={[
      { t: at("Entiende el problema").s, text: "Entiende el problema" },
      { t: at("Valora lo que haces").s, text: "Valora lo que haces" },
      { t: at("La conversación es").s, text: "La conversación es distinta" },
      { t: at("si existe encaje").s, text: "Si hay encaje, la venta avanza" },
    ]} />
    <Emphasis from={emp1} to={pC.from - 0.05} pre="Quizá sea todo lo que decide" main="quién llega y en qué condiciones." />
    <ListPanel {...pC} icon="check" compact title="Captar leads ya no alcanza. También necesitas:" items={[
      { t: at("necesitas filtrar").s + 0.3, text: "Filtrar" },
      { t: at("preparar").s, text: "Preparar" },
      { t: at("conseguir que la persona").s, text: "Que agende la persona correcta" },
      { t: at("reducir ausencias").s, text: "Reducir ausencias" },
      { t: at("dar seguimiento").s, text: "Dar seguimiento" },
      { t: at("y saber qué").s, text: "Saber qué pasa con cada oportunidad" },
    ]} />
    <Emphasis from={emp2} to={title - 0.05} pre="Piezas que funcionan por separado:" main="actividad sin buenas oportunidades." />
    <TitleCard from={title} to={titleTo} kicker="Por eso creamos" title="Pipeline First" />
    <StrikeQuote from={strikeFrom} strikeAt={strikeAt} to={bridgeFrom - 0.05} text="Solo generar más leads" />
    <Bridge from={bridgeFrom} to={bridgeTo} left="Ve tu mensaje" right="Oportunidad que vale la pena" label="Todo lo que pasa en el medio" />
    <ListPanel {...pD} icon="num" title="Pipeline First conecta 5 partes" items={[
      { t: at("Captación").s, text: "Captación", hl: [hl.capt, hl.cal] },
      { t: at("calificación agendamiento").s, text: "Calificación", hl: [hl.cal, hl.ag] },
      { t: at("agendamiento").s, text: "Agendamiento", hl: [hl.ag, hl.seg] },
      { t: nx("seguimiento Pipeline", 0), text: "Seguimiento", hl: [hl.seg, hl.end] },
      { t: nx("seguimiento Pipeline", 1), text: "Pipeline" },
    ]} />
    <ListPanel {...pE} icon="x" title="Si resuelves solo una parte" items={[
      { t: at("buenos anuncios").s, text: "Buenos anuncios, malas llamadas" },
      { t: at("buenos leads").s, text: "Buenos leads que se pierden antes de agendar" },
      { t: at("una gran conversación").s, text: "Una gran conversación que después desaparece" },
    ]} />
    <Emphasis from={emp3} to={END} pre="Pipeline First no es una campaña aislada." main="Lo implementamos por etapas." />

    <Subtitles words={words} panels={panels} hide={[
      [slA, slB], [emp1 - 0.05, pC.from], [emp2 - 0.05, bridgeTo], [emp3 - 0.05, END],
    ]} />

    <Sequence from={f(slA)} durationInFrames={f(slB) - f(slA)}>
      <Slam words={words} startIdx={sl.i} count={7} accent={["llamada."]} />
    </Sequence>
  </AbsoluteFill>
);
