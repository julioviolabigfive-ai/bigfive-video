import React from "react";
import { AbsoluteFill, Easing, interpolate, OffthreadVideo, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { alpha, C, f, FONT, FPS, Pattern, Sfx, SOBRE_ACENTO, Word } from "./lib";
import { ENCUADRE } from "./brand";

const smooth = Easing.bezier(0.45, 0, 0.25, 1);
const ease = Easing.bezier(0.22, 1, 0.36, 1);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Zonas para 1080x1920, según el encuadre medido del proyecto (brand.ts → ENCUADRE): nada tapa cara ni pecho.
const Z = ENCUADRE.vertical;
export const SUB_Y = Z.subtitulos;
const LOWER_TOP = Z.pecho + 20;
const LOWER_BOTTOM = 1920 - Z.piso;
// Zona inferior: el gráfico se apoya en `piso` y crece hacia arriba; si no entra entre pecho y piso, se escala para que entre.
const Lower: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{ position: "absolute", left: 0, right: 0, top: LOWER_TOP, bottom: LOWER_BOTTOM, display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center" }}>
    <FitBox max={Z.piso - LOWER_TOP}><div style={style}>{children}</div></FitBox>
  </div>
);
// Escala el contenido hacia abajo si es más alto que `max` px (mide el DOM una vez por fotograma).
const FitBox: React.FC<{ max: number; children: React.ReactNode }> = ({ max, children }) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const [k, setK] = React.useState(1);
  React.useLayoutEffect(() => {
    const h = ref.current?.scrollHeight ?? 0;
    setK(h > max ? max / h : 1);
  });
  return <div ref={ref} style={{ width: "100%", transform: `scale(${k})`, transformOrigin: "50% 100%" }}>{children}</div>;
};

// ---------- Cámara con zooms suaves ----------
export type CamKeyV = { t: number; scale: number; dur?: number };
export const CameraV: React.FC<{ src: string; cam: CamKeyV[] }> = ({ src, cam }) => {
  const frame = useCurrentFrame();
  let s = cam[0]?.scale ?? 1;
  for (const k of cam) {
    const a = f(k.t), d = k.dur ?? 40;
    if (frame >= a) s = interpolate(frame, [a, a + d], [s, k.scale], { ...clamp, easing: smooth });
  }
  return (
    <AbsoluteFill style={{ backgroundColor: C.navy }}>
      <AbsoluteFill style={{ transform: `scale(${s})`, transformOrigin: "50% 36%" }}>
        <OffthreadVideo src={staticFile(src)} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------- Subtítulos verticales ----------
type Chunk = { words: Word[]; s: number; e: number };
const chunkify = (words: Word[]): Chunk[] => {
  const out: Chunk[] = [];
  let cur: Word[] = [];
  const flush = () => { if (cur.length) out.push({ words: cur, s: cur[0].s, e: cur[cur.length - 1].e }); cur = []; };
  for (const w of words) {
    cur.push(w);
    const chars = cur.map((x) => x.w).join(" ").length;
    if (/[.?!,:]$/.test(w.w) || cur.length >= 4 || chars > 20) flush();
  }
  flush();
  return out;
};

export const SubtitlesV: React.FC<{ words: Word[]; hide: [number, number][]; y?: number }> = ({ words, hide, y = SUB_Y }) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  if (hide.some(([a, b]) => t >= a && t < b)) return null;
  const chunks = chunkify(words);
  const idx = chunks.findIndex((c, i) => t >= c.s - 0.05 && t < (chunks[i + 1]?.s ?? c.e + 0.6) - 0.05);
  if (idx < 0) return null;
  const c = chunks[idx];
  const start = Math.floor((c.s - 0.05) * FPS);
  const pop = interpolate(frame, [start, start + 4], [0.92, 1], { ...clamp, easing: ease });
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: y, display: "flex", justifyContent: "center" }}>
      <div style={{
        maxWidth: 920, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0 20px", transform: `scale(${pop})`,
        fontFamily: FONT, fontWeight: 900, fontSize: 74, lineHeight: 1.12, letterSpacing: -1,
      }}>
        {c.words.map((w, i) => {
          const active = t >= w.s - 0.03 && t < (c.words[i + 1]?.s ?? c.e + 0.6) - 0.03;
          return (
            <span key={i} style={{
              color: active ? C.orange : C.white, display: "inline-block",
              textShadow: "0 4px 0 rgba(0,0,0,.6), 0 0 28px rgba(0,0,0,.6), 0 0 5px rgba(0,0,0,.85)",
            }}>{w.w.replace(/[.,:]$/, "")}</span>
          );
        })}
      </div>
    </div>
  );
};

const useInOut = (from: number, to: number) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const visible = frame >= f(from) && frame < f(to);
  const sp = spring({ frame: frame - f(from), fps, config: { damping: 17, stiffness: 150 } });
  const out = interpolate(frame, [f(to) - 7, f(to)], [1, 0], clamp);
  return { frame, fps, visible, sp, out };
};

// ---------- Título del gancho (arriba) ----------
export const HookTitle: React.FC<{ from: number; to: number; pre?: string; main: string }> = ({ from, to, pre, main }) => {
  const { visible, sp, out } = useInOut(from, to);
  if (!visible) return null;
  return (
    <div style={{ position: "absolute", left: 60, right: 60, bottom: 1920 - Z.cabeza + 20, display: "flex", justifyContent: "center", opacity: sp * out, transform: `translateY(${(1 - sp) * -30}px)` }}>
      <div style={{ background: C.navy, borderRadius: 24, padding: "24px 36px", borderBottom: `8px solid ${C.orange}`, textAlign: "center", boxShadow: "0 20px 50px rgba(0,0,0,.35)" }}>
        {pre && <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 36, color: "rgba(255,255,255,.85)", marginBottom: 6 }}>{pre}</div>}
        <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 58, color: C.white, lineHeight: 1.08, letterSpacing: -1.5 }}>{main}</div>
      </div>
      <Sfx name="whoosh" at={from} />
    </div>
  );
};

// ---------- Tarjeta con lista (mitad inferior) ----------
export type ItemV = { t: number; text: string };
export const ListCardV: React.FC<{ from: number; to: number; title?: string; items: ItemV[]; icon: "x" | "check" | "num" }> = ({ from, to, title, items, icon }) => {
  const { frame, fps, visible, sp, out } = useInOut(from, to);
  if (!visible) return null;
  const iconBg = icon === "x" ? C.red : C.orange;
  return (
    <Lower style={{
      position: "relative", margin: "0 70px", opacity: sp * out, transform: `translateY(${(1 - sp) * 60}px)`,
      background: alpha(C.navy, .95), borderRadius: 30, padding: "30px 34px 18px", overflow: "hidden", boxShadow: "0 24px 60px rgba(0,0,0,.4)",
    }}>
      <Pattern opacity={0.06} />
      <div style={{ position: "relative" }}>
        {title && <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 40, color: C.white, marginBottom: 20, letterSpacing: -0.5 }}>{title}</div>}
        {items.map((it, i) => {
          const a = f(it.t);
          if (frame < a) return null;
          const s2 = spring({ frame: frame - a, fps, config: { damping: 16, stiffness: 170 } });
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 14, opacity: s2, transform: `translateX(${(1 - s2) * 60}px)` }}>
              <div style={{
                width: 48, height: 48, borderRadius: 24, background: iconBg, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: FONT, fontWeight: 900, fontSize: 26, color: C.white,
              }}>
                {icon === "num" ? i + 1 : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
                    {icon === "x" ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 12.5l5 5L20 6.5" />}
                  </svg>
                )}
              </div>
              <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 40, color: C.white, lineHeight: 1.15 }}>{it.text}</div>
            </div>
          );
        })}
      </div>
      <Sfx name="whoosh" at={from} />
      {items.map((it, i) => <Sfx key={i} name="click" at={it.t} />)}
    </Lower>
  );
};

// ---------- Frase que se tacha (mitad inferior) ----------
export const StrikeV: React.FC<{ from: number; strikeAt: number; to: number; text: string }> = ({ from, strikeAt, to, text }) => {
  const { frame, visible, sp, out } = useInOut(from, to);
  if (!visible) return null;
  const strike = interpolate(frame, [f(strikeAt), f(strikeAt) + 9], [0, 1], { ...clamp, easing: ease });
  return (
    <Lower style={{ display: "flex", justifyContent: "center", paddingBottom: 20 }}>
      <div style={{
        position: "relative", padding: "26px 48px", background: C.white, borderRadius: 24, opacity: sp * out,
        transform: `scale(${interpolate(sp, [0, 1], [0.8, 1])}) rotate(-1.5deg)`, boxShadow: "0 24px 60px rgba(0,0,0,.35)",
      }}>
        <span style={{ fontFamily: FONT, fontWeight: 900, fontSize: 72, color: C.navy, letterSpacing: -2 }}>{text}</span>
        <div style={{ position: "absolute", left: 36, top: "50%", height: 12, width: `calc((100% - 72px) * ${strike})`, background: C.orange, borderRadius: 6, transform: "rotate(-2deg)" }} />
      </div>
      <Sfx name="click" at={from} />
      <Sfx name="whoosh" at={strikeAt} />
    </Lower>
  );
};

// ---------- Énfasis (mitad inferior) ----------
export const EmphasisV: React.FC<{ from: number; to: number; pre?: string; main: string }> = ({ from, to, pre, main }) => {
  const { visible, sp, out } = useInOut(from, to);
  if (!visible) return null;
  return (
    <Lower style={{ margin: "0 70px", textAlign: "center", opacity: sp * out, transform: `translateY(${(1 - sp) * 40}px)` }}>
      {pre && <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 44, color: C.white, textShadow: "0 2px 16px rgba(0,0,0,.7)", marginBottom: 12 }}>{pre}</div>}
      <div style={{
        display: "inline-block", padding: "16px 34px", background: C.navy, borderRadius: 18, borderBottom: `8px solid ${C.orange}`,
        fontFamily: FONT, fontWeight: 900, fontSize: 66, color: C.white, letterSpacing: -1.5, lineHeight: 1.1,
      }}>{main}</div>
      <Sfx name="whoosh" at={from} vol={0.2} />
    </Lower>
  );
};

// ---------- Fichas que se apilan (p. ej. herramientas o etapas) ----------
export const ChipsV: React.FC<{ from: number; to: number; title?: string; chips: { t: number; text: string }[]; connected?: boolean }> = ({ from, to, title, chips, connected }) => {
  const { frame, fps, visible, sp, out } = useInOut(from, to);
  if (!visible) return null;
  return (
    <Lower style={{ margin: "0 60px", opacity: sp * out, display: "flex", flexDirection: "column", alignItems: "center" }}>
      {title && <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 40, color: C.white, textShadow: "0 2px 14px rgba(0,0,0,.7)", marginBottom: 16 }}>{title}</div>}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 14, maxWidth: 960 }}>
        {chips.map((c, i) => {
          const a = f(c.t);
          if (frame < a) return null;
          const s2 = spring({ frame: frame - a, fps, config: { damping: 14, stiffness: 190 } });
          return (
            <React.Fragment key={i}>
              {connected && i > 0 && <div style={{ alignSelf: "center", fontFamily: FONT, fontWeight: 900, fontSize: 40, color: C.orange, opacity: s2 }}>→</div>}
              <div style={{
                padding: "16px 28px", borderRadius: 16, background: connected ? C.orange : alpha(C.navy, .95),
                border: `2px solid ${connected ? C.orange : "rgba(255,255,255,.25)"}`, transform: `scale(${s2})`,
                fontFamily: FONT, fontWeight: 800, fontSize: 42, color: connected ? SOBRE_ACENTO : C.white, boxShadow: "0 12px 30px rgba(0,0,0,.3)",
              }}>{c.text}</div>
            </React.Fragment>
          );
        })}
      </div>
      {chips.map((c, i) => <Sfx key={i} name="click" at={c.t} />)}
    </Lower>
  );
};

// ---------- Llamado a la acción final ----------
export const CtaV: React.FC<{ from: number; to: number; text: string; sub?: string }> = ({ from, to, text, sub }) => {
  const { frame, visible, sp } = useInOut(from, to + 1);
  if (!visible) return null;
  return (
    <Lower style={{ textAlign: "center", opacity: sp, transform: `translateY(${(1 - sp) * 50}px)`, paddingBottom: 20 }}>
      {sub && <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 42, color: C.white, textShadow: "0 2px 16px rgba(0,0,0,.75)", marginBottom: 18 }}>{sub}</div>}
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 18, padding: "26px 50px", borderRadius: 22, background: C.orange,
        boxShadow: `0 20px 50px ${alpha(C.orange, .45)}`, fontFamily: FONT, fontWeight: 900, fontSize: 60, color: SOBRE_ACENTO,
      }}>
        {text}
        <svg width="48" height="48" viewBox="0 0 24 24" style={{ transform: `translateY(${Math.sin(frame / 4) * 4}px)` }}>
          <path d="M12 4v15M5 12l7 7 7-7" fill="none" stroke={SOBRE_ACENTO} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <Sfx name="whoosh" at={from} />
    </Lower>
  );
};
