import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import data from "./p1_words.json";
import {
  Camera, Emphasis, f, JourneyBar, ListPanel, makeFinder, Panel, Slam, slamWindow, StrikeQuote, Subtitles, Word,
} from "./lib";

const words = data.words as Word[];
const at = makeFinder(words);
export const P1_DURATION = Math.ceil(data.duration * 25);

const slam = at("Están llegando las personas correctas");
const SLAM_COUNT = 8;
const [slamA, slamB] = slamWindow(words, slam.i, SLAM_COUNT, 0.35);

const p1From = at("Te agendan").s - 0.15;
const p1To = at("Y cuando esto pasa").s - 0.1;
const quoteFrom = at("Necesito más leads").s;
const quoteStrike = at("Pero antes").s;
const quoteTo = at("hay una pregunta").s;
const p2From = at("Cuando llega alguien").s - 0.1;
const p2To = at("Entonces quizá").s - 0.1;
const empFrom = at("Entonces quizá").s;
const journeyFrom = at("Quizá el problema está").s;
const END = data.duration + 0.2;

const panels: Panel[] = [
  { from: p1From, to: p1To, side: "right" },
  { from: p2From, to: p2To, side: "left" },
];

const cam = [
  { t: 0, scale: 1.04 },
  { t: at("escucha esto").s, scale: 1.18, dur: 30 },
  { t: p1From, scale: 1.0, dur: 30 },
  { t: quoteFrom, scale: 1.14, dur: 30 },
  { t: slamA, scale: 1.0, dur: 30 },
  { t: at("lo contrario").s, scale: 1.08, dur: 20 },
  { t: p2From, scale: 1.0, dur: 30 },
  { t: empFrom, scale: 1.15, dur: 30 },
  { t: journeyFrom, scale: 1.04, dur: 30 },
];

export const Parte1: React.FC = () => (
  <AbsoluteFill>
    <Camera src="p1_cut.mp4" cam={cam} panels={panels} />

    <ListPanel from={p1From} to={p1To} side="right" icon="x" title="Lo que pasa en tus llamadas" items={[
      { t: at("Te agendan").s, text: "Agendan y no aparecen" },
      { t: at("Llegan sin entender").s, text: "Llegan sin entender qué haces" },
      { t: at("Te dicen que").s, text: "“Solo estaba averiguando”" },
      { t: at("No tienen presupuesto").s, text: "No tienen presupuesto" },
      { t: at("escuchan el precio").s, text: "Desaparecen al escuchar el precio" },
    ]} />

    <StrikeQuote from={quoteFrom} strikeAt={quoteStrike} to={quoteTo} text="“Necesito más leads.”" />

    <ListPanel from={p2From} to={p2To} side="left" icon="check" title="Cuando llega un referido" items={[
      { t: at("Entiende mejor").s, text: "Entiende mejor tu servicio" },
      { t: at("Hay más confianza").s, text: "Hay más confianza" },
      { t: at("Tiene una necesidad").s, text: "Tiene una necesidad real" },
      { t: at("si encaja").s, text: "Si encaja, puedes vender" },
    ]} />

    <Emphasis from={empFrom} to={journeyFrom - 0.05} pre="Quizá el problema" main="no sea tu servicio." />

    <JourneyBar from={journeyFrom} to={END} steps={["Anuncio", "Mensaje", "Filtro", "Agenda", "Llamada"]}
      litAt={[at("a quién estás").s, at("estás atrayendo").s + 0.3, at("qué ocurre antes").s, at("qué ocurre antes").s + 0.3]}
      bracketAt={at("antes de que").s} bracketText="Lo que pasa antes de la llamada" />

    <Subtitles words={words} panels={panels} hide={[
      [slamA, slamB], [quoteFrom - 0.05, quoteTo], [empFrom - 0.05, journeyFrom], [journeyFrom - 0.05, END],
    ]} />

    <Sequence from={f(slamA)} durationInFrames={f(slamB) - f(slamA)}>
      <Slam words={words} startIdx={slam.i} count={SLAM_COUNT} accent={["personas", "correctas"]} />
    </Sequence>
  </AbsoluteFill>
);
