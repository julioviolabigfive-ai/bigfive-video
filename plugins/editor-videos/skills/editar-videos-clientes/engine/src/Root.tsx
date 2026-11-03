import { Composition, Still } from "remotion";
import { Cover } from "./cover";
import { FPS } from "./lib";

// Registrar acá las composiciones del cliente (ver la carpeta ejemplos/ de la skill):
//   VSL / confirmación: 1920x1080   ·   anuncios: 1080x1920   ·   fps = FPS (25)
// Portadas: un <Still> por video, con el fotograma elegido en public/.

export const Root: React.FC = () => (
  <>
    <Still id="PortadaVSL" component={Cover} width={1920} height={1080}
      defaultProps={{ bg: "portada_vsl.jpg", headline: "Titular de la portada", accent: ["portada"], kicker: "Video", play: true }} />
    <Still id="PortadaAnuncio1" component={Cover} width={1080} height={1920}
      defaultProps={{ bg: "portada_a1.jpg", headline: "Titular del anuncio", accent: ["anuncio"], play: false }} />
  </>
);

export { Composition, FPS };
