import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import data from "./p4_words.json";
import { C, Camera, Emphasis, f, ListPanel, makeFinder, Panel, Slam, slamWindow, StrikeQuote, Subtitles, Word } from "./lib";
import { CasePanel, CrmPanel } from "./lib2";

const words = data.words as Word[];
const at = makeFinder(words);
export const P4_DURATION = Math.ceil(data.duration * 25);
const END = data.duration + 0.2;

const pFases = { from: 0.3, to: at("Qué personas llegan").s - 0.1, side: "right" as const };
const pMide = { from: at("Qué personas llegan").s - 0.05, to: at("Porque al final").s - 0.05, side: "left" as const };
const strikeFrom = at("no queremos medir").s, strikeAt = at("Queremos entender").s;
const emp1 = at("cuántas buenas").s, emp1To = at("Ese es el punto").s;
const emp2 = at("Construir un proceso").s, emp2To = at("Y esto no es").s;
const cCarlos = { from: at("Por ejemplo con Carlos").s, to: at("En otro proyecto").s - 0.05, side: "right" as const };
const cFer = { from: at("En otro proyecto").s, to: at("Eso resume").s - 0.05, side: "left" as const };
const sl = at("A veces significa");
const [slA, slB] = slamWindow(words, sl.i, 6, 0.4);
const cGrace = { from: at("También hemos trabajado").s, to: at("Y en el caso de Ricardo").s - 0.05, side: "right" as const };
const cRic = { from: at("Y en el caso de Ricardo").s, to: at("Pero sí muestran").s - 0.05, side: "left" as const };
const crm = { from: at("Abres tu pipeline").s, to: at("Pero sobre todo").s - 0.05, side: "right" as const };
const emp3 = at("puedes empezar a entender").s, emp3To = at("Si están llegando").s;
const pDonde = { from: emp3To, to: END, side: "left" as const };
const panels: Panel[] = [pFases, pMide, cCarlos, cFer, cGrace, cRic, crm, pDonde];

const cam = [
  { t: 0, scale: 1.0 },
  { t: pMide.to, scale: 1.1, dur: 30 },
  { t: emp2To, scale: 1.04, dur: 30 },
  { t: at("Ya hemos visto").s, scale: 1.14, dur: 30 },
  { t: cCarlos.from, scale: 1.0, dur: 30 },
  { t: slB, scale: 1.0, dur: 30 },
  { t: cRic.to, scale: 1.12, dur: 30 },
  { t: at("Es lunes por la mañana").s, scale: 1.18, dur: 30 },
  { t: crm.from, scale: 1.0, dur: 30 },
  { t: emp3, scale: 1.1, dur: 30 },
  { t: pDonde.from, scale: 1.0, dur: 30 },
];

export const Parte4: React.FC = () => (
  <AbsoluteFill>
    <Camera src="p4_cut.mp4" cam={cam} panels={panels} />

    <ListPanel {...pFases} icon="num" title="Lo implementamos por etapas" items={[
      { t: at("Primero ponemos").s, text: "FastLead", sub: "Captación e información real del mercado" },
      { t: at("Después profundizamos").s, text: "Lead Qualification", sub: "Calificación y preparación antes de la llamada" },
      { t: at("Y a partir de ahí").s, text: "Optimización", sub: "Mejoramos lo que realmente está ocurriendo" },
    ]} />
    <ListPanel {...pMide} icon="q" compact title="Lo que empezamos a ver" items={[
      { t: at("Qué personas llegan").s, text: "Qué personas llegan" },
      { t: at("Quién agenda").s, text: "Quién agenda" },
      { t: at("Quién asiste").s, text: "Quién asiste" },
      { t: at("Qué calidad tienen").s, text: "Qué calidad tienen las conversaciones" },
      { t: at("Y en qué parte").s, text: "Dónde se pierden oportunidades" },
    ]} />
    <StrikeQuote from={strikeFrom} strikeAt={strikeAt} to={emp1 - 0.05} text="Cuántos leads entraron" />
    <Emphasis from={emp1} to={emp1To - 0.05} pre="Queremos entender" main="cuántas buenas oportunidades generas." />
    <Emphasis from={emp2} to={emp2To - 0.05} pre="Un proceso que puedas" main="ver, medir y mejorar." />

    <CasePanel {...cCarlos} name="Carlos Pimentel" context="BRHS · Primera semana del proyecto" stats={[
      { t: at("80 leads").s, value: 80, label: "leads calificados" },
      { t: at("8 citas").s, value: 8, label: "citas agendadas y efectivas" },
    ]} />
    <CasePanel {...cFer} name="Fernando Coba" context="Oferta cercana a USD 3.000" stats={[
      { t: at("73").s, value: 73, prefix: "+", suffix: "%", label: "en ingresos" },
      { t: at("45.000 dólares").s, value: 45000, prefix: "USD ", suffix: "+", label: "mensuales" },
      { t: at("a la mitad").s, value: 50, prefix: "~", suffix: "%", label: "menos llamadas necesarias" },
    ]} />
    <CasePanel {...cGrace} name="Grace Sandoval" context="Sistema evergreen con VSL" stats={[
      { t: at("60 citas").s, value: 60, prefix: "+", label: "citas calificadas al mes" },
    ]} />
    <CasePanel {...cRic} name="Ricardo Bolaños" context="Oferta cercana a USD 2.100" stats={[
      { t: at("10.000 dólares").s, value: 10000, prefix: "USD ", suffix: "+", label: "mensuales" },
    ]} />

    <CrmPanel {...crm} title="Tu pipeline · Lunes 9:00" rows={[
      { t: at("acaba de entrar").s, label: "Acaba de entrar", color: C.blue, people: ["MG", "LP", "AR"] },
      { t: at("realmente encaja").s, label: "Encaja", color: "#1f9d6a", people: ["MG", "AR"] },
      { t: at("Quién agendó").s, label: "Agendó", color: C.orange, people: ["MG"] },
      { t: at("Quién no asistió").s, label: "No asistió", color: "#e5484d", people: ["JC"] },
      { t: at("necesita seguimiento").s, label: "Necesita seguimiento", color: "#7c80a8", people: ["LP", "DS"] },
      { t: at("qué oportunidades siguen").s, label: "Avanzando", color: C.navy, people: ["AR", "MG"] },
    ]} />
    <Emphasis from={emp3} to={emp3To - 0.05} pre="Y sobre todo, puedes empezar a entender" main="por qué." />
    <ListPanel {...pDonde} icon="check" title="Sabes dónde mirar" items={[
      { t: at("Si están llegando").s, text: "Llegan personas equivocadas", sub: "Revisas la captación" },
      { t: at("Si llegan buenos").s, text: "Buenos prospectos, pocos agendan", sub: "Sabes dónde mirar" },
      { t: at("Si reservan").s, text: "Reservan y no aparecen", sub: "Trabajas esa parte del proceso" },
      { t: at("Y si las llamadas").s, text: "Las oportunidades se enfrían", sub: "El problema está en otro lugar" },
    ]} />

    <Subtitles words={words} panels={panels} hide={[
      [strikeFrom - 0.05, emp1To], [emp2 - 0.05, emp2To], [slA, slB], [emp3 - 0.05, emp3To],
    ]} />

    <Sequence from={f(slA)} durationInFrames={f(slB) - f(slA)}>
      <Slam words={words} startIdx={sl.i} count={6} accent={["mejores"]} />
    </Sequence>
  </AbsoluteFill>
);
