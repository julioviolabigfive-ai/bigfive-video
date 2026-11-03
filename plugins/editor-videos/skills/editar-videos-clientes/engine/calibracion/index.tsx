import React from "react";
import { Composition, registerRoot } from "remotion";
import { Calibracion } from "./Calibracion";

// Punto de entrada aparte: solo lo usa scripts/calibrar.mjs. Los proyectos de clientes no lo copian.
registerRoot(() => <Composition id="Calibracion" component={Calibracion} width={1920} height={1080} fps={25} durationInFrames={150} />);
