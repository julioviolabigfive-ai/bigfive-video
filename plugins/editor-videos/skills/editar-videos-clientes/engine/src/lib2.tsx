import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C, f, FONT, FPS, panelProgress, PanelBar, Pattern, Sfx, Side, SidePanel, SOBRE_ACENTO } from "./lib";
import { alpha, CIERRE, LOGO } from "./brand";

const ease = Easing.bezier(0.22, 1, 0.36, 1);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const useInOut = (from: number, to: number) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const visible = frame >= f(from) && frame < f(to);
  const sp = spring({ frame: frame - f(from), fps, config: { damping: 16, stiffness: 170 } });
  const out = interpolate(frame, [f(to) - 6, f(to)], [1, 0], clamp);
  return { frame, fps, visible, sp, out };
};

// ---------- Cartel de presentación de Julio ----------
export const LowerThird: React.FC<{ from: number; to: number; name: string; role: string; line2?: string; line2At?: number }> = ({
  from, to, name, role, line2, line2At = 1e9,
}) => {
  const { frame, fps, visible, sp, out } = useInOut(from, to);
  if (!visible) return null;
  const l2 = spring({ frame: frame - f(line2At), fps, config: { damping: 16, stiffness: 170 } });
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 80, bottom: 220, opacity: out, transform: `translateX(${(1 - sp) * -520}px)` }}>
        <div style={{ display: "flex", background: C.white, borderRadius: 18, overflow: "hidden", boxShadow: "0 20px 50px rgba(0,0,0,.35)" }}>
          <div style={{ width: 10, background: C.orange }} />
          <div style={{ padding: "22px 34px 24px" }}>
            {LOGO.file && <Img src={staticFile(LOGO.file)} style={{ height: 30, marginBottom: 12 }} />}
            <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 50, color: C.navy, letterSpacing: -1, lineHeight: 1 }}>{name}</div>
            <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 27, color: C.blue, marginTop: 8 }}>{role}</div>
          </div>
        </div>
        {line2 && frame >= f(line2At) && (
          <div style={{
            marginTop: 12, display: "inline-block", padding: "12px 22px", background: C.navy, borderRadius: 12,
            fontFamily: FONT, fontWeight: 700, fontSize: 26, color: C.white, opacity: l2, transform: `translateY(${(1 - l2) * 16}px)`,
          }}>{line2}</div>
        )}
      </div>
      <Sfx name="whoosh" at={from} />
      {line2 && <Sfx name="click" at={line2At} />}
    </AbsoluteFill>
  );
};

// ---------- Puente: de un punto a otro ----------
export const Bridge: React.FC<{ from: number; to: number; left: string; right: string; label: string; side?: Side }> = ({ from, to, left, right, label, side }) => {
  const { frame, visible, sp, out } = useInOut(from, to);
  const line = interpolate(frame, [f(from) + 6, f(from) + 24], [0, 1], { ...clamp, easing: ease });
  const pill = (txt: string, strong: boolean) => (
    <div style={{
      padding: "16px 26px", borderRadius: 14, fontFamily: FONT, fontWeight: 800, fontSize: 32, whiteSpace: side ? "normal" : "nowrap",
      background: strong ? C.white : "rgba(255,255,255,.1)", color: strong ? C.navy : C.white,
      border: `2px solid ${strong ? C.white : "rgba(255,255,255,.3)"}`,
    }}>{txt}</div>
  );
  if (side) {
    // Puente en columna: de arriba hacia abajo.
    return (
      <SidePanel from={from} to={to} side={side} sfx={<Sfx name="whoosh" at={from} />}>
        {pill(left, false)}
        <div style={{ display: "flex", alignItems: "center", gap: 20, height: 150, marginLeft: 40 }}>
          <div style={{ width: 5, height: `${line * 100}%`, alignSelf: "flex-start", background: C.orange, borderRadius: 3 }} />
          <div style={{ opacity: line, fontFamily: FONT, fontWeight: 800, fontSize: 24, color: C.orange, letterSpacing: 1.5, textTransform: "uppercase" }}>{label}</div>
        </div>
        {pill(right, true)}
      </SidePanel>
    );
  }
  if (!visible) return null;
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 60 }}>
      <div style={{
        opacity: sp * out, transform: `translateY(${(1 - sp) * 40}px)`, padding: "26px 40px",
        background: alpha(C.navy, .94), borderRadius: 26, boxShadow: "0 20px 50px rgba(0,0,0,.35)",
        display: "flex", alignItems: "center", gap: 18,
      }}>
        {pill(left, false)}
        <div style={{ position: "relative", width: 380, height: 70, display: "flex", alignItems: "center" }}>
          <div style={{ height: 5, width: `${line * 100}%`, background: C.orange, borderRadius: 3 }} />
          <div style={{
            position: "absolute", left: 0, right: 0, top: -8, textAlign: "center", opacity: line,
            fontFamily: FONT, fontWeight: 800, fontSize: 22, color: C.orange, letterSpacing: 1.5, textTransform: "uppercase",
          }}>{label}</div>
          <svg width="22" height="22" viewBox="0 0 24 24" style={{ position: "absolute", right: -6, opacity: line > 0.97 ? 1 : 0 }}>
            <path d="M6 4l10 8-10 8" fill="none" stroke={C.orange} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        {pill(right, true)}
      </div>
      <Sfx name="whoosh" at={from} />
    </AbsoluteFill>
  );
};

// ---------- Título a pantalla completa ----------
export const TitleCard: React.FC<{ from: number; to: number; kicker: string; title: string }> = ({ from, to, kicker, title }) => {
  const { frame, visible, sp } = useInOut(from, to);
  if (!visible) return null;
  const bar = interpolate(frame, [f(from) + 4, f(from) + 18], [0, 1], { ...clamp, easing: ease });
  return (
    <AbsoluteFill style={{ backgroundColor: C.navy, justifyContent: "center", alignItems: "center" }}>
      <Pattern opacity={0.07} />
      <div style={{ textAlign: "center", transform: `scale(${interpolate(sp, [0, 1], [0.92, 1])})`, opacity: sp }}>
        <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 34, color: C.orange, letterSpacing: 6, textTransform: "uppercase", marginBottom: 14 }}>{kicker}</div>
        <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 168, color: C.white, letterSpacing: -6, lineHeight: 1 }}>{title}</div>
        <div style={{ height: 12, width: 520 * bar, background: C.orange, borderRadius: 6, margin: "26px auto 0" }} />
      </div>
      <Sfx name="whooshBig" at={from} />
      <Sfx name="impact" at={from + 0.15} />
    </AbsoluteFill>
  );
};

// ---------- Panel de caso con números animados ----------
export type Stat = { t: number; value: number; prefix?: string; suffix?: string; label: string };
const fmt = (n: number) => Math.round(n).toLocaleString("es-AR");

export const CasePanel: React.FC<{
  from: number; to: number; side: "left" | "right"; name: string; context: string; stats: Stat[]; footnote?: string;
}> = ({ from, to, side, name, context, stats, footnote = "Resultado de un proyecto específico. No representa una garantía." }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = panelProgress(frame, [{ from, to, side }], side);
  const sfx = <><Sfx name="whoosh" at={from} />{stats.map((s, i) => <Sfx key={i} name="click" at={s.t} />)}</>;
  if (p <= 0) return frame < f(from) + 2 ? sfx : null;
  const W = 720;
  return (
    <AbsoluteFill>
      {sfx}
      <div style={{
        position: "absolute", top: 0, bottom: 0, width: W, [side]: 0, transform: `translateX(${(1 - p) * (side === "right" ? W : -W)}px)`,
        backgroundColor: C.navy, overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 70px",
      }}>
        <Pattern opacity={0.06} />
        <div style={{ position: "relative" }}>
          <div style={{
            display: "inline-block", padding: "6px 14px", borderRadius: 8, background: C.orange, marginBottom: 18,
            fontFamily: FONT, fontWeight: 800, fontSize: 20, color: SOBRE_ACENTO, letterSpacing: 3,
          }}>CASO</div>
          <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 56, color: C.white, letterSpacing: -1.5, lineHeight: 1.05 }}>{name}</div>
          <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 28, color: "rgba(255,255,255,.75)", marginTop: 10, marginBottom: 36 }}>{context}</div>
          {stats.map((s, i) => {
            const a = f(s.t);
            if (frame < a) return null;
            const sp = spring({ frame: frame - a, fps, config: { damping: 16, stiffness: 170 } });
            const v = interpolate(frame, [a, a + 18], [0, s.value], { ...clamp, easing: ease });
            return (
              <div key={i} style={{
                marginBottom: 22, paddingBottom: 20, borderBottom: "1px solid rgba(255,255,255,.14)",
                opacity: sp, transform: `translateY(${(1 - sp) * 24}px)`,
              }}>
                <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 84, color: C.orange, letterSpacing: -2, lineHeight: 1 }}>
                  {s.prefix ?? ""}{fmt(v)}{s.suffix ?? ""}
                </div>
                <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 30, color: C.white, marginTop: 6 }}>{s.label}</div>
              </div>
            );
          })}
          <div style={{ fontFamily: FONT, fontWeight: 500, fontSize: 19, color: "rgba(255,255,255,.55)", marginTop: 8 }}>{footnote}</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- Panel tipo CRM ----------
export type CrmRow = { t: number; label: string; color: string; people: string[] };
export const CrmPanel: React.FC<{ from: number; to: number; side: "left" | "right"; title: string; rows: CrmRow[] }> = ({ from, to, side, title, rows }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = panelProgress(frame, [{ from, to, side }], side);
  const sfx = <><Sfx name="whoosh" at={from} />{rows.map((r, i) => <Sfx key={i} name="click" at={r.t} />)}</>;
  if (p <= 0) return frame < f(from) + 2 ? sfx : null;
  const W = 720;
  return (
    <AbsoluteFill>
      {sfx}
      <div style={{
        position: "absolute", top: 0, bottom: 0, width: W, [side]: 0, transform: `translateX(${(1 - p) * (side === "right" ? W : -W)}px)`,
        backgroundColor: C.navy, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 56px",
      }}>
        <Pattern opacity={0.06} />
        <div style={{ position: "relative", background: "#f4f5fb", borderRadius: 22, overflow: "hidden", boxShadow: "0 30px 70px rgba(0,0,0,.4)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 22px", background: C.white, borderBottom: "1px solid #e3e5f0" }}>
            {["#ff5f57", "#febc2e", "#28c840"].map((c) => <div key={c} style={{ width: 13, height: 13, borderRadius: 7, background: c }} />)}
            <div style={{ marginLeft: 14, fontFamily: FONT, fontWeight: 800, fontSize: 24, color: C.navy }}>{title}</div>
          </div>
          <div style={{ padding: "18px 20px 8px" }}>
            {rows.map((r, i) => {
              const a = f(r.t);
              if (frame < a) return null;
              const sp = spring({ frame: frame - a, fps, config: { damping: 15, stiffness: 190 } });
              return (
                <div key={i} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, padding: "14px 18px",
                  background: C.white, borderRadius: 12, borderLeft: `7px solid ${r.color}`, boxShadow: `0 2px 6px ${alpha(C.navy, .08)}`,
                  opacity: sp, transform: `translateX(${(1 - sp) * 50}px)`,
                }}>
                  <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 28, color: C.navy }}>{r.label}</div>
                  <div style={{ display: "flex" }}>
                    {r.people.map((pp, k) => (
                      <div key={k} style={{
                        width: 40, height: 40, borderRadius: 20, marginLeft: -8, border: "3px solid #fff", background: r.color,
                        display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT, fontWeight: 800, fontSize: 15, color: "#fff",
                      }}>{pp}</div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- Dos escenarios ----------
export type Card = { t: number; title: string; body: string };
export const TwoCards: React.FC<{ from: number; to: number; cards: Card[]; side?: Side }> = ({ from, to, cards, side }) => {
  const { frame, fps, visible, out } = useInOut(from, to);
  if (side) {
    // Tarjetas apiladas dentro del panel.
    return (
      <SidePanel from={from} to={to} side={side} sfx={<>{cards.map((c, i) => <Sfx key={i} name="click" at={c.t} />)}</>}>
        {cards.map((c, i) => {
          if (frame < f(c.t)) return null;
          const sp = spring({ frame: frame - f(c.t), fps, config: { damping: 15, stiffness: 180 } });
          return (
            <div key={i} style={{
              marginBottom: 22, padding: "24px 28px", borderRadius: 20, background: i === 0 ? "rgba(255,255,255,.08)" : C.white,
              border: i === 0 ? "1px solid rgba(255,255,255,.15)" : "none", opacity: sp, transform: `translateY(${(1 - sp) * 40}px)`,
              display: "flex", gap: 20, alignItems: "flex-start",
            }}>
              <div style={{
                width: 50, height: 50, borderRadius: 25, background: C.orange, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: FONT, fontWeight: 900, fontSize: 26, color: SOBRE_ACENTO,
              }}>{i + 1}</div>
              <div>
                <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 34, color: i === 0 ? C.white : C.navy, lineHeight: 1.1 }}>{c.title}</div>
                <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 25, color: i === 0 ? "rgba(255,255,255,.8)" : C.blue, marginTop: 8, lineHeight: 1.25 }}>{c.body}</div>
              </div>
            </div>
          );
        })}
      </SidePanel>
    );
  }
  if (!visible) return null;
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 60 }}>
      <div style={{ display: "flex", gap: 28, opacity: out }}>
        {cards.map((c, i) => {
          if (frame < f(c.t)) return <div key={i} style={{ width: 640 }} />;
          const sp = spring({ frame: frame - f(c.t), fps, config: { damping: 15, stiffness: 180 } });
          return (
            <div key={i} style={{
              width: 640, padding: "26px 32px", borderRadius: 22, background: i === 0 ? alpha(C.navy, .95) : C.white,
              boxShadow: "0 20px 50px rgba(0,0,0,.35)", opacity: sp, transform: `translateY(${(1 - sp) * 50}px)`,
              display: "flex", gap: 22, alignItems: "flex-start",
            }}>
              <div style={{
                width: 54, height: 54, borderRadius: 27, background: C.orange, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: FONT, fontWeight: 900, fontSize: 28, color: SOBRE_ACENTO,
              }}>{i + 1}</div>
              <div>
                <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 36, color: i === 0 ? C.white : C.navy, lineHeight: 1.1 }}>{c.title}</div>
                <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 26, color: i === 0 ? "rgba(255,255,255,.8)" : C.blue, marginTop: 8, lineHeight: 1.25 }}>{c.body}</div>
              </div>
            </div>
          );
        })}
      </div>
      {cards.map((c, i) => <Sfx key={i} name="click" at={c.t} />)}
    </AbsoluteFill>
  );
};

// ---------- Botón de llamado a la acción ----------
const Arrow: React.FC<{ frame: number; color?: string }> = ({ frame, color = SOBRE_ACENTO }) => (
  <svg width="40" height="40" viewBox="0 0 24 24" style={{ transform: `translateY(${Math.sin(frame / 4) * 4}px)` }}>
    <path d="M12 4v15M5 12l7 7 7-7" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const CtaBar: React.FC<{ from: number; to: number; text: string; sub?: string; side?: Side }> = ({ from, to, text, sub, side }) => {
  const { frame, visible, sp, out } = useInOut(from, to);
  if (side) {
    return (
      <SidePanel from={from} to={to} side={side} sfx={<Sfx name="whoosh" at={from} />}>
        <PanelBar />
        {sub && <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 36, color: C.white, opacity: 0.9, lineHeight: 1.2, marginBottom: 28 }}>{sub}</div>}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 16, padding: "22px 36px", borderRadius: 18, background: C.orange,
          boxShadow: `0 18px 46px ${alpha(C.orange, .45)}`, fontFamily: FONT, fontWeight: 900, fontSize: 42, color: SOBRE_ACENTO, letterSpacing: -0.5,
        }}>{text}<Arrow frame={frame} /></div>
      </SidePanel>
    );
  }
  if (!visible) return null;
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 70 }}>
      <div style={{ textAlign: "center", opacity: sp * out, transform: `translateY(${(1 - sp) * 40}px)` }}>
        {sub && <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 30, color: C.white, marginBottom: 14, textShadow: "0 2px 14px rgba(0,0,0,.7)" }}>{sub}</div>}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 18, padding: "22px 44px", borderRadius: 18, background: C.orange,
          boxShadow: `0 18px 46px ${alpha(C.orange, .45)}`, fontFamily: FONT, fontWeight: 900, fontSize: 46, color: SOBRE_ACENTO, letterSpacing: -0.5,
        }}>{text}<Arrow frame={frame} /></div>
      </div>
      <Sfx name="whoosh" at={from} />
    </AbsoluteFill>
  );
};

// ---------- Pantalla final ----------
export const EndCard: React.FC<{ from: number; to: number }> = ({ from, to }) => {
  const { frame, visible, sp } = useInOut(from, to + 1);
  if (!visible) return null;
  return (
    <AbsoluteFill style={{ backgroundColor: C.navy, justifyContent: "center", alignItems: "center" }}>
      <Pattern opacity={0.07} />
      <div style={{ textAlign: "center", opacity: sp, transform: `translateY(${(1 - sp) * 30}px)` }}>
        {LOGO.file && (
          <div style={{ display: "inline-block", background: LOGO.bg, padding: "18px 34px", borderRadius: 18, marginBottom: 46 }}>
            <Img src={staticFile(LOGO.file)} style={{ height: 54, display: "block" }} />
          </div>
        )}
        <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 82, color: C.white, letterSpacing: -2.5, lineHeight: 1.05 }}>
          {CIERRE.titulo}{CIERRE.destacado && <><br /><span style={{ color: C.orange }}>{CIERRE.destacado}</span></>}
        </div>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 16, marginTop: 50, padding: "20px 40px", borderRadius: 16,
          border: `3px solid ${C.orange}`, fontFamily: FONT, fontWeight: 800, fontSize: 36, color: C.white,
        }}>{CIERRE.boton}<Arrow frame={frame} color={C.orange} /></div>
      </div>
      <Sfx name="whooshBig" at={from} />
    </AbsoluteFill>
  );
};

export { FPS };
