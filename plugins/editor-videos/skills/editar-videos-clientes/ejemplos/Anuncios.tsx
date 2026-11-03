import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import d1 from "./a1_words.json";
import d2 from "./a2_words.json";
import d3 from "./a3_words.json";
import d4 from "./a4_words.json";
import d5 from "./a5_words.json";
import { f, makeFinder, Slam, slamWindow, Word } from "./lib";
import { CameraV, CamKeyV, ChipsV, CtaV, EmphasisV, HookTitle, ListCardV, StrikeV, SubtitlesV } from "./libv";

type Data = { duration: number; words: Word[] };
const prep = (d: Data) => {
  const words = d.words as Word[];
  return { words, at: makeFinder(words), end: d.duration + 0.1, frames: Math.ceil(d.duration * 25) };
};

const Shell: React.FC<{
  src: string; words: Word[]; cam: CamKeyV[]; hide: [number, number][];
  slams: { i: number; count: number; accent: string[]; size?: number }[]; children: React.ReactNode;
}> = ({ src, words, cam, hide, slams, children }) => {
  const wins = slams.map((s) => slamWindow(words, s.i, s.count, 0.4));
  return (
    <AbsoluteFill>
      <CameraV src={src} cam={cam} />
      {children}
      <SubtitlesV words={words} hide={[...hide, ...wins]} />
      {slams.map((s, k) => (
        <Sequence key={k} from={f(wins[k][0])} durationInFrames={f(wins[k][1]) - f(wins[k][0])}>
          <Slam words={words} startIdx={s.i} count={s.count} accent={s.accent} fontSize={s.size ?? 112} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

// ---------- Anuncio 1 — Narrativo con metáfora ----------
const A1 = prep(d1 as Data);
export const A1_FRAMES = A1.frames;
export const Anuncio1: React.FC = () => {
  const { at, words, end } = A1;
  const sala = at("pero es como").s, unos = at("Unos reservan").s, piensas = at("Entonces piensas").s;
  const nec = at("necesito más leads").s, pero = at("Pero quizá").s;
  const sl = at("están llegando las personas");
  const mala = at("Porque una mala").s, quien = at("En quién atraes").s, porEso = at("Por eso creamos").s, clic = at("Haz clic").s;
  return (
    <Shell src="a1_cut.mp4" words={words} slams={[{ i: sl.i, count: 8, accent: ["personas", "correctas"] }]}
      hide={[[sala, unos], [nec, sl.s], [mala, quien], [porEso, clic]]}
      cam={[{ t: 0, scale: 1.0 }, { t: 1.0, scale: 1.06, dur: 90 }, { t: at("escucha esto").s - 0.6, scale: 1.12, dur: 30 },
        { t: unos, scale: 1.03, dur: 45 }, { t: nec, scale: 1.1, dur: 40 }, { t: mala, scale: 1.04, dur: 45 },
        { t: porEso, scale: 1.1, dur: 40 }, { t: clic, scale: 1.04, dur: 45 }]}>
      <HookTitle from={0.1} to={at("escucha esto").e + 0.3} pre="Si vendes por llamada:" main="¿Reuniones con personas que no van a comprar?" />
      <EmphasisV from={sala} to={unos - 0.05} pre="Es como llenar una sala" main="sin controlar quién entra." />
      <ListCardV from={unos} to={piensas - 0.05} icon="x" items={[
        { t: unos, text: "Unos reservan y no aparecen" },
        { t: at("otros llegan").s, text: "Otros llegan sin entender qué haces" },
        { t: at("algunos desaparecen").s, text: "Algunos desaparecen con el precio" },
      ]} />
      <StrikeV from={nec} strikeAt={pero} to={sl.s - 0.05} text="“Necesito más leads.”" />
      <EmphasisV from={mala} to={quien - 0.05} pre="Una mala llamada" main="empieza antes de la llamada." />
      <ChipsV from={quien} to={porEso - 0.05} connected chips={[
        { t: quien, text: "A quién atraes" }, { t: at("cómo lo filtras").s, text: "Cómo filtras" }, { t: at("y cómo llega").s, text: "Cómo llega" },
      ]} />
      <EmphasisV from={porEso} to={clic - 0.05} pre="Por eso creamos" main="Pipeline First" />
      <CtaV from={clic} to={end} sub="Te explicamos cómo funciona" text="Mira el video" />
    </Shell>
  );
};

// ---------- Anuncio 2 — Fricción técnica ----------
const A2 = prep(d2 as Data);
export const A2_FRAMES = A2.frames;
export const Anuncio2: React.FC = () => {
  const { at, words, end } = A2;
  const lead = at("Porque un lead").s, reunion = at("Y una reunión").s, camp = at("Puedes tener campañas").s;
  const ent = at("Entonces quizá").s, puede = at("Puede estar en").s, quien = at("quién estás atrayendo").s;
  const porEso = at("Por eso en BigFive").s, sl = at("Más leads no solucionan"), pf = at("Pipeline First conecta").s, clic = at("Haz clic").s;
  return (
    <Shell src="a2_cut.mp4" words={words} slams={[{ i: sl.i, count: 8, accent: ["calidad."] }]}
      hide={[[lead, reunion], [ent, porEso], [pf, clic]]}
      cam={[{ t: 0, scale: 1.0 }, { t: 1.0, scale: 1.06, dur: 90 }, { t: lead, scale: 1.12, dur: 30 }, { t: camp, scale: 1.03, dur: 45 },
        { t: ent, scale: 1.1, dur: 40 }, { t: porEso, scale: 1.04, dur: 40 }, { t: pf, scale: 1.1, dur: 40 }, { t: clic, scale: 1.04, dur: 45 }]}>
      <HookTitle from={0.1} to={at("esto es para ti").e + 0.3} pre="Tus campañas generan leads, pero…" main="¿Llegan con poca intención de compra?" />
      <EmphasisV from={lead} to={reunion - 0.05} main="Un lead no es una oportunidad." />
      <ListCardV from={camp} to={ent - 0.05} icon="x" title="Campañas funcionando, pero llegan:" items={[
        { t: at("sin presupuesto").s, text: "Sin presupuesto" },
        { t: at("sin suficiente necesidad").s, text: "Sin suficiente necesidad" },
        { t: at("simplemente estaban averiguando").s, text: "Solo averiguando" },
      ]} />
      <StrikeV from={ent} strikeAt={puede} to={quien - 0.05} text="Más tráfico" />
      <EmphasisV from={quien} to={porEso - 0.05} pre="El problema puede estar en" main="qué pasa antes de la llamada." />
      <EmphasisV from={pf} to={clic - 0.05} pre="Pipeline First conecta todo el recorrido" main="para generar mejores oportunidades." />
      <CtaV from={clic} to={end} text="Mira el video" />
    </Shell>
  );
};

// ---------- Anuncio 3 — Sobrecarga operativa ----------
const A3 = prep(d3 as Data);
export const A3_FRAMES = A3.frames;
export const Anuncio3: React.FC = () => {
  const { at, words, end } = A3;
  const tiempo = at("también significa tiempo").s, prep_ = at("prepararte").s, si = at("Si esto pasa").s;
  const noNec = at("no necesariamente").s, sl = at("Quizás necesites mejores");
  const porEso = at("Por eso Pipeline First").s, clic = at("Haz clic").s;
  return (
    <Shell src="a3_cut.mp4" words={words} slams={[{ i: sl.i, count: 4, accent: ["mejores"], size: 124 }]}
      hide={[[tiempo, prep_], [noNec, sl.s]]}
      cam={[{ t: 0, scale: 1.0 }, { t: 1.0, scale: 1.06, dur: 90 }, { t: tiempo, scale: 1.12, dur: 30 }, { t: prep_, scale: 1.03, dur: 45 },
        { t: si, scale: 1.1, dur: 40 }, { t: porEso, scale: 1.04, dur: 45 }]}>
      <HookTitle from={0.1} to={at("presta atención").e + 0.3} pre="Tú o tu equipo pierden horas en" main="llamadas que nunca debieron ocurrir" />
      <EmphasisV from={tiempo} to={prep_ - 0.05} pre="Una mala llamada también es" main="tiempo perdido." />
      <ListCardV from={prep_} to={si - 0.05} icon="num" items={[
        { t: prep_, text: "Prepararte" },
        { t: at("entrar a la reunión").s, text: "Entrar a la reunión" },
        { t: at("escuchar a alguien").s, text: "Escuchar a quien no entiende tu servicio" },
        { t: at("hacer seguimiento").s, text: "Hacer seguimiento" },
        { t: at("y descubrir después").s, text: "Descubrir que nunca iba a avanzar" },
      ]} />
      <StrikeV from={noNec} strikeAt={at("necesitas más reuniones").s + 0.4} to={sl.s - 0.05} text="Más reuniones" />
      <ChipsV from={porEso} to={clic - 0.05} connected title="Pipeline First trabaja" chips={[
        { t: at("antes y después").s, text: "Antes" }, { t: at("y después de la").s, text: "Llamada" }, { t: at("de la llamada para").s, text: "Después" },
      ]} />
      <CtaV from={clic} to={end} sub="Te explicamos cómo" text="Mira el video" />
    </Shell>
  );
};

// ---------- Anuncio 4 — Estructura multipolar ----------
const A4 = prep(d4 as Data);
export const A4_FRAMES = A4.frames;
export const Anuncio4: React.FC = () => {
  const { at, words, end } = A4;
  const tener = at("Puedes tener anuncios").s, sl = at("tener todas las herramientas");
  const persona = at("La persona correcta").s, eso = at("Eso es lo que").s, con = at("Conectamos").s;
  const obj = at("Porque el objetivo").s, siHoy = at("Si hoy tienes").s;
  return (
    <Shell src="a4_cut.mp4" words={words} slams={[{ i: sl.i, count: 10, accent: ["juntas."], size: 100 }]}
      hide={[[obj, siHoy]]}
      cam={[{ t: 0, scale: 1.0 }, { t: 1.0, scale: 1.06, dur: 90 }, { t: tener, scale: 1.03, dur: 45 }, { t: sl.s, scale: 1.08, dur: 1 },
        { t: persona, scale: 1.03, dur: 45 }, { t: eso, scale: 1.1, dur: 40 }, { t: con, scale: 1.03, dur: 45 }, { t: obj, scale: 1.1, dur: 40 }, { t: siHoy, scale: 1.04, dur: 45 }]}>
      <HookTitle from={0.1} to={at("Escucha esto").e + 0.3} pre="Ya generas prospectos, pero…" main="¿Las conversaciones no llegan a ningún lado?" />
      <ChipsV from={tener} to={sl.s} title="Puedes tener:" chips={[
        { t: at("anuncios").s, text: "Anuncios" }, { t: at("landing").s, text: "Landing" }, { t: at("formulario").s, text: "Formulario" },
        { t: at("CRM").s, text: "CRM" }, { t: at("calendario").s, text: "Calendario" },
      ]} />
      <ListCardV from={persona} to={eso - 0.05} icon="check" title="La persona correcta tiene que ser:" items={[
        { t: at("atraída").s, text: "Atraída" }, { t: at("filtrada").s, text: "Filtrada" },
        { t: at("preparada").s, text: "Preparada" }, { t: at("y acompañada").s, text: "Acompañada hasta la conversación" },
      ]} />
      <ChipsV from={con} to={obj - 0.05} connected title="Pipeline First conecta" chips={[
        { t: at("Captación").s, text: "Captación" }, { t: at("Calificación").s, text: "Calificación" }, { t: at("Agendamiento").s, text: "Agendamiento" },
        { t: at("Seguimiento").s, text: "Seguimiento" }, { t: at("Seguimiento Pipeline").e + 0.05, text: "Pipeline" },
      ]} />
      <EmphasisV from={obj} to={siHoy - 0.05} pre="El objetivo no es generar actividad." main="Más personas correctas en tu proceso." />
      <CtaV from={siHoy} to={end} sub="¿Movimiento pero poca calidad?" text="Mira el video" />
    </Shell>
  );
};

// ---------- Anuncio 5 — Impacto personal ----------
const A5 = prep(d5 as Data);
export const A5_FRAMES = A5.frames;
export const Anuncio5: React.FC = () => {
  const { at, words, end } = A5;
  const cuantas = at("Cuántas realmente").s, preg = at("Pregúntate").s, porque = at("Porque una cosa").s;
  const sl = at("Esta persona nunca");
  const rep = at("Cuando eso se repite").s, pero = at("Pero quizá").s, porEso = at("Por eso creamos").s, clic = at("Haz clic").s;
  return (
    <Shell src="a5_cut.mp4" words={words} slams={[{ i: sl.i, count: 8, accent: ["nunca"] }]}
      hide={[[cuantas, preg], [pero, clic]]}
      cam={[{ t: 0, scale: 1.0 }, { t: 0.5, scale: 1.08, dur: 70 }, { t: cuantas, scale: 1.13, dur: 30 }, { t: preg, scale: 1.03, dur: 45 },
        { t: porque, scale: 1.1, dur: 45 }, { t: rep, scale: 1.03, dur: 45 }, { t: pero, scale: 1.1, dur: 40 }, { t: clic, scale: 1.04, dur: 45 }]}>
      <HookTitle from={0.1} to={cuantas - 0.05} pre="Si vendes por llamada:" main="Piensa en tus últimas 10 reuniones." />
      <EmphasisV from={cuantas} to={preg - 0.05} main="¿Cuántas valieron la pena?" />
      <ListCardV from={preg} to={porque - 0.05} icon="num" title="¿La persona…" items={[
        { t: at("tenía una necesidad").s, text: "tenía una necesidad real?" },
        { t: at("entendía tu servicio").s, text: "entendía tu servicio?" },
        { t: at("podía pagarlo").s, text: "podía pagarlo?" },
        { t: at("y tenía intención").s, text: "tenía intención de avanzar?" },
      ]} />
      <ListCardV from={rep} to={pero - 0.05} icon="x" title="Empiezas a cuestionar:" items={[
        { t: at("el precio").s, text: "El precio" }, { t: at("la oferta").s, text: "La oferta" }, { t: at("tu forma de vender").s, text: "Tu forma de vender" },
      ]} />
      <EmphasisV from={pero} to={porEso - 0.05} pre="Quizá el problema empezó antes:" main="quién llegó y cómo llegó." />
      <EmphasisV from={porEso} to={clic - 0.05} pre="Por eso creamos" main="Pipeline First" />
      <CtaV from={clic} to={end} sub="Entiende qué pasa con tus llamadas" text="Mira el video" />
    </Shell>
  );
};
