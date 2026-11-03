import React from "react";
import { AbsoluteFill, Img, staticFile, useVideoConfig } from "remotion";
import { C, LOGO, SOBRE_ACENTO } from "./brand";
import { FONT, Pattern } from "./lib";

// Portada (miniatura). bg = fotograma del presentador en public/ (cara expresiva, boca cerrada o sonrisa).
export type CoverProps = {
  bg: string;
  headline: string;
  accent?: string[];
  kicker?: string;
  play?: boolean;
  shiftX?: number;
};

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9ñ]/g, "");

const Headline: React.FC<{ text: string; accent: string[]; size: number; align: "left" | "center" }> = ({ text, accent, size, align }) => {
  const acc = accent.map(norm);
  return (
    <div style={{
      fontFamily: FONT, fontWeight: 900, fontSize: size, lineHeight: 1.02, letterSpacing: -size / 32, color: C.white,
      textAlign: align, textShadow: "0 6px 30px rgba(0,0,0,.35)",
    }}>
      {text.split(" ").map((w, i) => (
        <span key={i} style={{ color: acc.includes(norm(w)) ? C.orange : C.white }}>{w}{" "}</span>
      ))}
    </div>
  );
};

const Logo: React.FC<{ h: number }> = ({ h }) => !LOGO.file ? null : (
  <div style={{ display: "inline-block", background: LOGO.bg, padding: `${h * 0.35}px ${h * 0.6}px`, borderRadius: h * 0.4 }}>
    <Img src={staticFile(LOGO.file!)} style={{ height: h, display: "block" }} />
  </div>
);

const PlayButton: React.FC<{ size: number }> = ({ size }) => (
  <div style={{
    width: size, height: size, borderRadius: size / 2, background: C.orange, display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: `0 0 0 ${size * 0.12}px rgba(255,255,255,.18), 0 20px 50px rgba(0,0,0,.4)`,
  }}>
    <svg width={size * 0.42} height={size * 0.42} viewBox="0 0 24 24"><path d="M7 4.5v15l13-7.5z" fill={SOBRE_ACENTO} /></svg>
  </div>
);

export const Cover: React.FC<CoverProps> = ({ bg, headline, accent = [], kicker, play = true, shiftX }) => {
  const { width, height } = useVideoConfig();
  const vertical = height > width;
  if (vertical) {
    return (
      <AbsoluteFill style={{ backgroundColor: C.navy }}>
        <Img src={staticFile(bg)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <AbsoluteFill style={{ background: `linear-gradient(180deg, ${C.navy}99 0%, ${C.navy}00 18%, ${C.navy}00 50%, ${C.navy}d9 64%, ${C.navy} 80%)` }} />
        <div style={{ position: "absolute", top: 140, left: 0, right: 0, display: "flex", justifyContent: "center" }}><Logo h={44} /></div>
        <div style={{ position: "absolute", bottom: 340, left: 70, right: 70, display: "flex", flexDirection: "column", alignItems: "center" }}>
          {play && <div style={{ marginBottom: 36 }}><PlayButton size={120} /></div>}
          {kicker && <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 36, color: C.orange, letterSpacing: 4, textTransform: "uppercase", textAlign: "center", marginBottom: 16 }}>{kicker}</div>}
          <Headline text={headline} accent={accent} size={92} align="center" />
        </div>
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill style={{ backgroundColor: C.navy }}>
      <Img src={staticFile(bg)} style={{ position: "absolute", height: "100%", width: "100%", objectFit: "cover", transform: `translateX(${shiftX ?? 330}px)` }} />
      <AbsoluteFill style={{ background: `linear-gradient(90deg, ${C.navy} 0%, ${C.navy} 34%, ${C.navy}d9 46%, ${C.navy}00 66%)` }} />
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 820, overflow: "hidden" }}><Pattern opacity={0.06} /></div>
      <div style={{ position: "absolute", left: 110, top: 0, bottom: 0, width: 900, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ marginBottom: 46 }}><Logo h={40} /></div>
        {kicker && <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 34, color: C.orange, letterSpacing: 5, textTransform: "uppercase", marginBottom: 20 }}>{kicker}</div>}
        <Headline text={headline} accent={accent} size={104} align="left" />
        <div style={{ width: 120, height: 10, borderRadius: 5, background: C.orange, marginTop: 36 }} />
      </div>
      {play && <div style={{ position: "absolute", right: 120, bottom: 110 }}><PlayButton size={130} /></div>}
    </AbsoluteFill>
  );
};
