import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import data from "./p5_words.json";
import { Camera, Emphasis, f, ListPanel, makeFinder, Panel, Slam, slamWindow, StrikeQuote, Subtitles, Word } from "./lib";
import { CtaBar, EndCard, TwoCards } from "./lib2";

const words = data.words as Word[];
const at = makeFinder(words);
const VIDEO_END = data.duration;
const fin = at("Nos vemos dentro").e + 0.35;
const END = fin + 3.6;
export const P5_DURATION = Math.ceil(END * 25);

const q1From = at("necesitamos más leads").s, q1Strike = at("porque puedes ver").s, q1To = at("Ese es el escenario").s - 0.05;
const pEsc = { from: at("Ese es el escenario").s, to: at("No se trata").s - 0.05, side: "right" as const };
const sl1 = at("se trata de dejar");
const [s1A, s1B] = slamWindow(words, sl1.i, 8, 0.4);
const cta1 = at("puedes agendar una sesión").s, cta1To = at("En esa conversación").s - 0.05;
const pSes = { from: at("En esa conversación").s, to: at("No necesitas llegar").s - 0.05, side: "right" as const };
const pReq = { from: at("No necesitas llegar").s, to: at("Después de analizarlo").s - 0.05, side: "left" as const };
const two = at("puede pasar una").s, twoTo = at("Primero entendemos").s - 0.05;
const emp1 = at("Primero entendemos").s, emp1To = at("Porque al final").s - 0.05;
const q2From = at("el objetivo no es").s, q2Strike = at("Es conseguir que").s, q2To = q2Strike + 1.1;
const sl2 = at("Más leads no solucionan");
const [s2A, s2B] = slamWindow(words, sl2.i, 8, 0.4);
const emp2 = at("Y el lead es").s, emp2To = at("Lo importante es todo").s - 0.05;
const cta2 = at("haz clic debajo").s;
const panels: Panel[] = [pEsc, pSes, pReq];

const cam = [
  { t: 0, scale: 1.06 },
  { t: pEsc.from, scale: 1.0, dur: 30 },
  { t: at("No se trata").s, scale: 1.14, dur: 30 },
  { t: s1A, scale: 1.04, dur: 30 },
  { t: at("primero tenemos que ver").s, scale: 1.12, dur: 30 },
  { t: pSes.from, scale: 1.0, dur: 30 },
  { t: two, scale: 1.06, dur: 30 },
  { t: q2From, scale: 1.12, dur: 30 },
  { t: s2A, scale: 1.04, dur: 30 },
  { t: at("Lo importante es todo").s, scale: 1.16, dur: 30 },
  { t: at("Si quieres que analicemos").s, scale: 1.06, dur: 30 },
];

export const Parte5: React.FC = () => (
  <AbsoluteFill>
    <Sequence durationInFrames={f(VIDEO_END)}>
      <Camera src="p5_cut.mp4" cam={cam} panels={panels} />
    </Sequence>

    <StrikeQuote from={q1From} strikeAt={q1Strike} to={q1To} text="“Necesitamos más leads.”" />
    <ListPanel {...pEsc} icon="check" title="El escenario que buscamos" items={[
      { t: at("Menos conversaciones").s, text: "Menos conversaciones que nunca debieron ocurrir" },
      { t: at("más oportunidades que").s, text: "Más oportunidades que vale la pena trabajar" },
      { t: at("un proceso que puedas").s, text: "Un proceso que puedes observar y mejorar" },
    ]} />
    <CtaBar from={cta1} to={cta1To} text="Agenda tu sesión de diagnóstico sin costo" />
    <ListPanel {...pSes} icon="check" compact title="En la sesión revisamos" items={[
      { t: at("Qué tipo de leads").s, text: "Qué tipo de leads generas" },
      { t: at("Qué ocurre antes").s, text: "Qué pasa antes de la agenda" },
      { t: at("Quién está asistiendo").s, text: "Quién está asistiendo" },
      { t: at("Qué calidad tienen").s, text: "La calidad de las conversaciones" },
      { t: at("en qué punto").s, text: "Dónde se pierden oportunidades" },
    ]} />
    <ListPanel {...pReq} icon="check" title="Solo necesitamos que:" items={[
      { t: at("ya tengas clientes").s, text: "Ya tengas clientes" },
      { t: at("tu servicio se venda").s, text: "Tu servicio se venda" },
      { t: at("tengas capacidad").s, text: "Tengas capacidad para nuevas oportunidades" },
    ]} />
    <TwoCards from={two} to={twoTo} cards={[
      { t: at("Que Pipeline First no sea").s, title: "No es para ti", body: "Si Pipeline First no encaja, te lo decimos." },
      { t: at("o que encontremos").s, title: "Hay un punto claro de mejora", body: "Te mostramos dónde podemos ayudarte." },
    ]} />
    <Emphasis from={emp1} to={emp1To} pre="Primero entendemos qué está pasando." main="Después vemos si tiene sentido avanzar." />
    <StrikeQuote from={q2From} strikeAt={q2Strike} to={q2To} text="Llenar tu agenda" />
    <Emphasis from={emp2} to={emp2To} pre="El lead es el inicio del proceso," main="no el resultado final." />
    <CtaBar from={cta2} to={fin} sub="Haz clic debajo de este video" text="Agenda tu sesión de diagnóstico" />
    <EndCard from={fin} to={END} />

    <Subtitles words={words} panels={panels} hide={[
      [q1From - 0.05, q1To], [s1A, s1B], [cta1 - 0.05, cta1To], [two - 0.05, emp1To + 0.05],
      [q2From - 0.05, q2To], [s2A, s2B], [emp2 - 0.05, emp2To], [cta2 - 0.05, END],
    ]} />

    <Sequence from={f(s1A)} durationInFrames={f(s1B) - f(s1A)}>
      <Slam words={words} startIdx={sl1.i} count={8} accent={["ciegas."]} />
    </Sequence>
    <Sequence from={f(s2A)} durationInFrames={f(s2B) - f(s2A)}>
      <Slam words={words} startIdx={sl2.i} count={8} accent={["calidad."]} />
    </Sequence>
  </AbsoluteFill>
);
