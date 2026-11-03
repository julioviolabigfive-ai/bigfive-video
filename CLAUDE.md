# Repositorio del plugin "editor-videos" (marketplace "bigfive")

## REGLA OBLIGATORIA: subir la versión en cada cambio

Las PCs del equipo se actualizan solas **solo si el número de versión sube**. Si se publica un cambio con la misma versión, nadie lo recibe.

Antes de cada commit que toque `plugins/`:

1. Subir la versión, con el mismo número, en estos dos archivos:
   - `plugins/editor-videos/.claude-plugin/plugin.json`
   - `.claude-plugin/marketplace.json` (entrada `editor-videos`)

   Arreglos: 2.0.1 → 2.0.2. Funciones nuevas: 2.0.2 → 2.1.0.
2. Si cambian las dependencias del motor (`engine/package.json` o `package-lock.json`), subir también la `version` de `engine/package.json` y regenerar `package-lock.json`. Así cada PC instala el motor nuevo en una carpeta aparte. Si solo cambia código de `engine/src`, no hace falta: `setup.mjs` lo copia siempre.
3. Correr `node tools/verificar-version.mjs` y `claude plugin validate .` antes de hacer push.

Chequeos automáticos de esta regla:

- `.githooks/pre-commit` frena el commit local. Activarlo una vez por clon con `git config core.hooksPath .githooks`.
- `.github/workflows/version.yml` marca en rojo en GitHub cualquier push que no la cumpla.

No desactivar ni saltear estos chequeos (`--no-verify`).

## Otras reglas

- El repo es **público**: no subir videos, credenciales, datos de clientes nuevos ni el contenido de `_edicion/`.
- Los efectos de sonido no se guardan en el repo: `setup.mjs` los descarga.
- Documentar todo cambio de comportamiento en `SKILL.md` y en el README.
