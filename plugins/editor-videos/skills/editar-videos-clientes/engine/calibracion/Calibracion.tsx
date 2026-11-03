import React from "react";
import { AbsoluteFill } from "remotion";
import { Camera, Emphasis, ListPanel, Panel, Subtitles, Word } from "../src/lib";

// Composición de calibración: la usa scripts/calibrar.mjs para medir cuántos fotogramas en paralelo
// rinde mejor esta PC. Carga típica de un VSL: video de fondo con zoom, panel lateral y subtítulos.
const words: Word[] = Array.from({ length: 30 }, (_, i) => ({ w: ["Pipeline", "visible,", "medible", "y", "predecible."][i % 5], s: i * 0.2, e: i * 0.2 + 0.18 }));
const panels: Panel[] = [{ from: 0, to: 6, side: "right" }];

export const Calibracion: React.FC = () => (
  <AbsoluteFill>
    <Camera src="calibracion.mp4" panels={panels} cam={[{ t: 0, scale: 1.0 }, { t: 0.5, scale: 1.12, dur: 60 }]} />
    <ListPanel from={0} to={6} side="right" icon="check" title="Calibración" items={[
      { t: 0.2, text: "Captación" }, { t: 0.6, text: "Calificación" }, { t: 1.0, text: "Seguimiento" },
    ]} />
    <Emphasis side="left" from={3} to={6} pre="Medición" main="de rendimiento" />
    <Subtitles words={words} panels={panels} hide={[]} />
  </AbsoluteFill>
);
