import React from "react";
import {
  AbsoluteFill, Audio, Easing, interpolate, OffthreadVideo, Sequence, spring,
  staticFile, useCurrentFrame, useVideoConfig,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont("normal", { weights: ["500", "700", "800", "900"], subsets: ["latin", "latin-ext"] });

export const FPS = 25;
export { C, alpha, SOBRE_ACENTO } from "./brand";
import { alpha, C, RESALTE_SLAM, SFX, SOBRE_ACENTO } from "./brand";
type SfxName = keyof typeof SFX.files;
// Efecto de sonido de un solo uso, posicionado con `at` (segundos) dentro de la composición actual.
export const Sfx: React.FC<{ name: SfxName; at: number; vol?: number }> = ({ name, at, vol }) =>
  SFX.on ? (
    <Sequence from={Math.max(0, Math.round(at * FPS))} durationInFrames={Math.round(2.5 * FPS)} layout="none">
      <Audio src={staticFile(`sfx/${SFX.files[name]}`)} volume={(vol ?? SFX.vol[name]) * SFX.master} />
    </Sequence>
  ) : null;
export const FONT = fontFamily;

export type Word = { w: string; s: number; e: number };
export const f = (t: number) => Math.round(t * FPS);

const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9ñ ]/g, "").trim();

export const makeFinder = (words: Word[]) => {
  const n = words.map((w) => norm(w.w));
  return (phrase: string, afterSec = 0) => {
    const toks = phrase.split(/\s+/).map(norm).filter(Boolean);
    for (let i = 0; i <= n.length - toks.length; i++) {
      if (words[i].s < afterSec) continue;
      if (toks.every((t, k) => n[i + k] === t)) return { i, s: words[i].s, e: words[i + toks.length - 1].e };
    }
    throw new Error(`Frase no encontrada: "${phrase}"`);
  };
};

const ease = Easing.bezier(0.22, 1, 0.36, 1);
const smooth = Easing.bezier(0.45, 0, 0.25, 1);

// ---------- Cámara ----------
export type CamKey = { t: number; scale: number; dur?: number };
export type Panel = { from: number; to: number; side: "left" | "right" };
const SHIFT = 330;

export const panelProgress = (frame: number, panels: Panel[], side: "left" | "right") => {
  let p = 0;
  for (const pn of panels.filter((x) => x.side === side)) {
    const a = f(pn.from), b = f(pn.to);
    const inP = interpolate(frame, [a, a + 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: smooth });
    const outP = interpolate(frame, [b, b + 18], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: smooth });
    p = Math.max(p, Math.min(inP, outP));
  }
  return p;
};

const camScale = (frame: number, keys: CamKey[]) => {
  let s = keys[0]?.scale ?? 1;
  for (const k of keys) {
    const a = f(k.t), d = k.dur ?? 32;
    if (frame >= a) s = interpolate(frame, [a, a + d], [s, k.scale], { extrapolateRight: "clamp", easing: smooth });
  }
  return s;
};

export const Camera: React.FC<{ src: string; cam: CamKey[]; panels: Panel[] }> = ({ src, cam, panels }) => {
  const frame = useCurrentFrame();
  const x = -SHIFT * panelProgress(frame, panels, "right") + SHIFT * panelProgress(frame, panels, "left");
  const s = camScale(frame, cam);
  return (
    <AbsoluteFill style={{ backgroundColor: C.navy }}>
      <AbsoluteFill style={{ transform: `translateX(${x}px) scale(${s})`, transformOrigin: "50% 36%" }}>
        <OffthreadVideo src={staticFile(src)} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------- Patrón de marca ----------
export const Pattern: React.FC<{ opacity?: number; color?: string }> = ({ opacity = 0.07, color = "#fff" }) => (
  <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity }}>
    <defs>
      <pattern id="hex" width="56" height="97" patternUnits="userSpaceOnUse">
        <path d="M28 0 L56 16 L56 48 L28 64 L0 48 L0 16 Z M28 64 L28 97 M0 16 L28 32 L56 16 M28 32 L28 64"
          fill="none" stroke={color} strokeWidth="1.4" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#hex)" />
  </svg>
);

// ---------- Subtítulos ----------
type Chunk = { words: Word[]; s: number; e: number };
const chunkify = (words: Word[]): Chunk[] => {
  const out: Chunk[] = [];
  let cur: Word[] = [];
  const flush = () => { if (cur.length) out.push({ words: cur, s: cur[0].s, e: cur[cur.length - 1].e }); cur = []; };
  for (const w of words) {
    cur.push(w);
    const chars = cur.map((x) => x.w).join(" ").length;
    if (/[.?!,:]$/.test(w.w) || cur.length >= 5 || chars > 30) flush();
  }
  flush();
  return out;
};

export const Subtitles: React.FC<{ words: Word[]; hide: [number, number][]; panels: Panel[] }> = ({ words, hide, panels }) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  if (hide.some(([a, b]) => t >= a && t < b)) return null;
  const chunks = chunkify(words);
  const idx = chunks.findIndex((c, i) => t >= c.s - 0.05 && t < (chunks[i + 1]?.s ?? c.e + 0.6) - 0.05);
  if (idx < 0) return null;
  const c = chunks[idx];
  const x = -SHIFT * panelProgress(frame, panels, "right") + SHIFT * panelProgress(frame, panels, "left");
  const start = Math.floor((c.s - 0.05) * FPS);
  const appear = interpolate(frame, [start, start + 3], [0.4, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 86 }}>
      <div style={{
        transform: `translateX(${x}px) translateY(${(1 - appear) * 10}px)`, opacity: appear, maxWidth: 1100,
        display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0 18px",
        fontFamily: FONT, fontWeight: 800, fontSize: 58, lineHeight: 1.15, letterSpacing: -0.5,
      }}>
        {c.words.map((w, i) => {
          const active = t >= w.s - 0.03 && t < (c.words[i + 1]?.s ?? c.e + 0.6) - 0.03;
          return (
            <span key={i} style={{
              color: active ? C.orange : C.white,
              display: "inline-block",
              textShadow: "0 3px 0 rgba(0,0,0,.55), 0 0 24px rgba(0,0,0,.55), 0 0 4px rgba(0,0,0,.8)",
            }}>{w.w.replace(/[.,:]$/, "")}</span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ---------- Slam naranja palabra por palabra ----------
export const Slam: React.FC<{ words: Word[]; startIdx: number; count: number; accent?: string[]; holdSec?: number; fontSize?: number }> = ({
  words, startIdx, count, accent = [], holdSec = 0.35, fontSize = 132,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ws = words.slice(startIdx, startIdx + count);
  const t0 = ws[0].s;
  const acc = accent.map(norm);
  const fin = f(ws[ws.length - 1].e - t0 + holdSec);
  const fundido = interpolate(frame, [0, 4, fin - 4, fin], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ backgroundColor: C.orange, justifyContent: "center", alignItems: "center", opacity: fundido }}>
      <Pattern opacity={0.1} color={C.navy} />
      <div style={{
        display: "flex", flexWrap: "wrap", justifyContent: "center", alignContent: "center",
        gap: "4px 30px", maxWidth: 1560, padding: "0 80px",
      }}>
        {ws.map((w, i) => {
          const wf = f(w.s - t0);
          if (frame < wf) return null;
          const sp = spring({ frame: frame - wf, fps, config: { damping: 13, stiffness: 260, mass: 0.6 } });
          const isAcc = acc.includes(norm(w.w));
          return (
            <span key={i} style={{
              fontFamily: FONT, fontWeight: 900, fontSize, lineHeight: 1.08, letterSpacing: -fontSize / 44,
              color: isAcc ? RESALTE_SLAM : C.navy, display: "inline-block",
              transform: `scale(${interpolate(sp, [0, 1], [1.45, 1])})`, opacity: interpolate(sp, [0, 0.3], [0, 1], { extrapolateRight: "clamp" }),
            }}>{w.w}</span>
          );
        })}
      </div>
      {ws.map((w, i) => <Sfx key={i} name={i === 0 ? "impact" : "click"} at={w.s - t0} />)}
    </AbsoluteFill>
  );
};

export const slamWindow = (words: Word[], startIdx: number, count: number, holdSec = 0.6): [number, number] => {
  const a = words[startIdx].s - 0.04;
  const b = words[startIdx + count - 1].e + holdSec;
  return [a, b];
};

// ---------- Panel lateral con lista ----------
export type Item = { t: number; text: string; sub?: string; hl?: [number, number] };
type Icon = "x" | "check" | "num" | "q";
const IconDot: React.FC<{ icon: Icon; n: number; on?: boolean }> = ({ icon, n, on }) => {
  const bg = icon === "x" ? C.red : icon === "q" ? C.blue : C.orange;
  return (
    <div style={{
      width: 44, height: 44, borderRadius: 22, flexShrink: 0, background: on ? C.white : bg,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: FONT, fontWeight: 900, fontSize: 24, color: on ? C.orange : C.white,
    }}>
      {icon === "num" ? n : icon === "q" ? "?" : (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={on ? C.orange : "#fff"} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
          {icon === "x" ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 12.5l5 5L20 6.5" />}
        </svg>
      )}
    </div>
  );
};

export const ListPanel: React.FC<{
  from: number; to: number; side: "left" | "right"; title: string; items: Item[]; icon: Icon; compact?: boolean;
}> = ({ from, to, side, title, items, icon, compact }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = panelProgress(frame, [{ from, to, side }], side);
  const sfx = <><Sfx name="whoosh" at={from} />{items.map((it, i) => <Sfx key={i} name="click" at={it.t} />)}</>;
  if (p <= 0) return frame < f(from) + 2 ? sfx : null;
  const t = frame / FPS;
  const W = 720;
  const dx = (1 - p) * (side === "right" ? W : -W);
  return (
    <AbsoluteFill>
      <div style={{
        position: "absolute", top: 0, bottom: 0, width: W, [side]: 0, transform: `translateX(${dx}px)`,
        backgroundColor: C.navy, overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "center",
        padding: "0 64px", boxShadow: side === "right" ? "-30px 0 60px rgba(0,0,0,.35)" : "30px 0 60px rgba(0,0,0,.35)",
      }}>
        <Pattern opacity={0.06} />
        <div style={{ position: "relative" }}>
          <div style={{ width: 64, height: 6, background: C.orange, borderRadius: 3, marginBottom: 22 }} />
          <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 46, color: C.white, lineHeight: 1.12, marginBottom: compact ? 28 : 40, letterSpacing: -1 }}>
            {title}
          </div>
          {items.map((it, i) => {
            const a = f(it.t);
            if (frame < a) return null;
            const sp = spring({ frame: frame - a, fps, config: { damping: 15, stiffness: 180 } });
            const on = !!it.hl && t >= it.hl[0] && t < it.hl[1];
            const dim = items.some((x) => x.hl && t >= x.hl[0] && t < x.hl[1]) && !on;
            return (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 22, marginBottom: compact ? 14 : 20, padding: compact ? "13px 22px" : "18px 24px",
                background: on ? C.orange : "rgba(255,255,255,.07)", border: `1px solid ${on ? C.orange : "rgba(255,255,255,.12)"}`, borderRadius: 16,
                transform: `translateX(${(1 - sp) * (side === "right" ? 80 : -80)}px) scale(${on ? 1.03 : 1})`, opacity: sp * (dim ? 0.45 : 1),
              }}>
                <IconDot icon={icon} n={i + 1} on={on} />
                <div>
                  <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: compact ? 31 : 34, color: on ? SOBRE_ACENTO : C.white, lineHeight: 1.2 }}>{it.text}</div>
                  {it.sub && <div style={{ fontFamily: FONT, fontWeight: 500, fontSize: 24, color: "rgba(255,255,255,.75)", marginTop: 4, lineHeight: 1.25 }}>{it.sub}</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {sfx}
    </AbsoluteFill>
  );
};

// ---------- Panel lateral genérico ----------
// Lleva cualquier gráfico al costado y empuja el video (agregar {from, to, side} a `panels` de Camera),
// así nunca tapa la cara ni el pecho del presentador.
export type Side = "left" | "right";
export const SidePanel: React.FC<{ from: number; to: number; side: Side; sfx?: React.ReactNode; children: React.ReactNode }> = ({
  from, to, side, sfx, children,
}) => {
  const frame = useCurrentFrame();
  const p = panelProgress(frame, [{ from, to, side }], side);
  if (p <= 0) return frame < f(from) + 2 ? <>{sfx}</> : null;
  const W = 720;
  return (
    <AbsoluteFill>
      <div style={{
        position: "absolute", top: 0, bottom: 0, width: W, [side]: 0, transform: `translateX(${(1 - p) * (side === "right" ? W : -W)}px)`,
        backgroundColor: C.navy, overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "center",
        padding: "0 64px", boxShadow: side === "right" ? "-30px 0 60px rgba(0,0,0,.35)" : "30px 0 60px rgba(0,0,0,.35)",
      }}>
        <Pattern opacity={0.06} />
        <div style={{ position: "relative" }}>{children}</div>
      </div>
      {sfx}
    </AbsoluteFill>
  );
};
export const PanelBar: React.FC = () => <div style={{ width: 64, height: 6, background: C.orange, borderRadius: 3, marginBottom: 22 }} />;

// ---------- Frase entre comillas que se tacha ----------
export const StrikeQuote: React.FC<{ from: number; strikeAt: number; to: number; text: string; side?: Side }> = ({ from, strikeAt, to, text, side }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const strike = interpolate(frame, [f(strikeAt), f(strikeAt) + 8], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  if (side) {
    return (
      <SidePanel from={from} to={to} side={side} sfx={<><Sfx name="click" at={from} /><Sfx name="whoosh" at={strikeAt} /></>}>
        <div style={{ position: "relative", padding: "26px 36px", background: C.white, borderRadius: 22, transform: "rotate(-1.5deg)" }}>
          <span style={{ fontFamily: FONT, fontWeight: 900, fontSize: 64, color: C.navy, letterSpacing: -2, lineHeight: 1.08 }}>{text}</span>
          <div style={{
            position: "absolute", left: 30, top: "50%", height: 12, width: `calc((100% - 60px) * ${strike / 100})`,
            background: C.orange, borderRadius: 6, transform: "rotate(-2deg)",
          }} />
        </div>
      </SidePanel>
    );
  }
  if (frame < f(from) || frame >= f(to)) return null;
  const sp = spring({ frame: frame - f(from), fps, config: { damping: 14, stiffness: 200 } });
  const out = interpolate(frame, [f(to) - 5, f(to)], [1, 0], { extrapolateLeft: "clamp" });
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 110 }}>
      <div style={{
        position: "relative", padding: "26px 54px", background: C.white, borderRadius: 22,
        transform: `scale(${interpolate(sp, [0, 1], [0.7, 1])}) rotate(-1.5deg)`, opacity: sp * out,
        boxShadow: "0 24px 60px rgba(0,0,0,.35)",
      }}>
        <span style={{ fontFamily: FONT, fontWeight: 900, fontSize: 84, color: C.navy, letterSpacing: -2 }}>{text}</span>
        <div style={{
          position: "absolute", left: 40, top: "52%", height: 12, width: `calc((100% - 80px) * ${strike / 100})`,
          background: C.orange, borderRadius: 6, transform: "rotate(-2deg)",
        }} />
      </div>
      <Sfx name="click" at={from} />
      <Sfx name="whoosh" at={strikeAt} />
    </AbsoluteFill>
  );
};

// ---------- Frase de énfasis (sin fondo naranja) ----------
export const Emphasis: React.FC<{ from: number; to: number; pre?: string; main: string; side?: Side }> = ({ from, to, pre, main, side }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (side) {
    return (
      <SidePanel from={from} to={to} side={side} sfx={<Sfx name="whoosh" at={from} vol={0.2} />}>
        <PanelBar />
        {pre && <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 40, color: C.white, opacity: 0.85, lineHeight: 1.15, marginBottom: 16 }}>{pre}</div>}
        <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 68, color: C.white, letterSpacing: -1.5, lineHeight: 1.05 }}>{main}</div>
        <div style={{ width: "100%", height: 8, background: C.orange, borderRadius: 4, marginTop: 26 }} />
      </SidePanel>
    );
  }
  if (frame < f(from) || frame >= f(to)) return null;
  const sp = spring({ frame: frame - f(from), fps, config: { damping: 16, stiffness: 160 } });
  const out = interpolate(frame, [f(to) - 5, f(to)], [1, 0], { extrapolateLeft: "clamp" });
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 80 }}>
      <div style={{ opacity: sp * out, transform: `translateY(${(1 - sp) * 30}px)`, textAlign: "center" }}>
        {pre && <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 40, color: C.white, opacity: 0.9, textShadow: "0 2px 12px rgba(0,0,0,.6)" }}>{pre}</div>}
        <div style={{
          display: "inline-block", marginTop: 10, padding: "12px 34px", background: C.navy, borderRadius: 14,
          fontFamily: FONT, fontWeight: 900, fontSize: 70, color: C.white, letterSpacing: -1.5,
          borderBottom: `8px solid ${C.orange}`,
        }}>{main}</div>
      </div>
      <Sfx name="whoosh" at={from} vol={0.2} />
    </AbsoluteFill>
  );
};

// ---------- Línea de tiempo: recorrido hasta la llamada ----------
export const JourneyBar: React.FC<{ from: number; to: number; steps: string[]; litAt: number[]; bracketAt: number; bracketText: string; side?: Side }> = ({
  from, to, steps, litAt, bracketAt, bracketText, side,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const br = interpolate(frame, [f(bracketAt), f(bracketAt) + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  const last = steps.length - 1;
  if (side) {
    // Recorrido en columna dentro del panel; el corchete marca los pasos previos a la llamada.
    return (
      <SidePanel from={from} to={to} side={side} sfx={<><Sfx name="whoosh" at={from} />{litAt.map((t, i) => <Sfx key={i} name="click" at={t} vol={0.25} />)}</>}>
        <div style={{ display: "flex", gap: 24 }}>
          <div style={{ flex: 1 }}>
            {steps.map((s, i) => {
              const lit = frame >= f(litAt[i] ?? 1e9);
              const isCall = i === last;
              const sp = spring({ frame: frame - f(from) - i * 3, fps, config: { damping: 14, stiffness: 200 } });
              return (
                <div key={i} style={{
                  transform: `translateX(${(1 - sp) * (side === "right" ? 60 : -60)}px)`, opacity: sp, marginBottom: 14, padding: "16px 24px", borderRadius: 14,
                  background: isCall ? C.white : lit ? C.orange : "rgba(255,255,255,.1)",
                  border: `2px solid ${isCall ? C.white : lit ? C.orange : "rgba(255,255,255,.25)"}`,
                  fontFamily: FONT, fontWeight: 800, fontSize: 34, color: isCall ? C.navy : lit ? SOBRE_ACENTO : C.white,
                }}>{s}</div>
              );
            })}
          </div>
          <div style={{ width: 22, opacity: br, borderTop: `4px solid ${C.orange}`, borderRight: `4px solid ${C.orange}`, borderBottom: `4px solid ${C.orange}`,
            borderRadius: "0 10px 10px 0", height: `${br * (last * 84 - 14)}px`, marginTop: 30 }} />
        </div>
        <div style={{ opacity: br, marginTop: 10, fontFamily: FONT, fontWeight: 800, fontSize: 28, color: C.orange, letterSpacing: 1, textTransform: "uppercase" }}>{bracketText}</div>
      </SidePanel>
    );
  }
  if (frame < f(from) || frame >= f(to)) return null;
  const inP = spring({ frame: frame - f(from), fps, config: { damping: 18, stiffness: 140 } });
  const out = interpolate(frame, [f(to) - 6, f(to)], [1, 0], { extrapolateLeft: "clamp" });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-end", paddingBottom: 40 }}>
      <div style={{
        opacity: inP * out, transform: `translateY(${(1 - inP) * 40}px)`, padding: "30px 46px 26px",
        background: alpha(C.navy, .92), borderRadius: 26, boxShadow: "0 20px 50px rgba(0,0,0,.35)",
      }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          {steps.map((s, i) => {
            const lit = frame >= f(litAt[i] ?? 1e9);
            const isCall = i === last;
            const sp = spring({ frame: frame - f(from) - i * 3, fps, config: { damping: 14, stiffness: 200 } });
            return (
              <React.Fragment key={i}>
                <div style={{
                  transform: `scale(${sp})`, padding: "16px 26px", borderRadius: 14,
                  background: isCall ? C.white : lit ? C.orange : "rgba(255,255,255,.1)",
                  border: `2px solid ${isCall ? C.white : lit ? C.orange : "rgba(255,255,255,.25)"}`,
                  fontFamily: FONT, fontWeight: 800, fontSize: 32, color: isCall ? C.navy : lit ? SOBRE_ACENTO : C.white,
                }}>{s}</div>
                {i < last && <div style={{ width: 46, height: 4, background: "rgba(255,255,255,.35)", margin: "0 8px", opacity: sp }} />}
              </React.Fragment>
            );
          })}
        </div>
        <div style={{ position: "relative", height: 70, marginTop: 14 }}>
          <div style={{
            position: "absolute", left: 0, top: 0, width: `calc(${br * 82}%)`, height: 18,
            borderLeft: `4px solid ${C.orange}`, borderRight: br > 0.95 ? `4px solid ${C.orange}` : "none", borderBottom: `4px solid ${C.orange}`,
            borderRadius: "0 0 10px 10px",
          }} />
          <div style={{
            position: "absolute", left: 0, width: "82%", top: 28, textAlign: "center", opacity: br,
            fontFamily: FONT, fontWeight: 800, fontSize: 30, color: C.orange, letterSpacing: 1, textTransform: "uppercase",
          }}>{bracketText}</div>
        </div>
      </div>
      <Sfx name="whoosh" at={from} />
      {litAt.map((t, i) => <Sfx key={i} name="click" at={t} vol={0.25} />)}
    </AbsoluteFill>
  );
};

