import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { readFileSync } from "node:fs";
import { parseReferenceSongText } from "../shared/referenceSongParser.js";
import { buildPresetFlow, buildTutorialGoal, buildTutorialPhases } from "../shared/tutorialPhases.js";

const configDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(configDir, "..");
const referenceSongPath = resolve(projectRoot, "Dark End Of Street.txt");
const referenceSong = parseReferenceSongText(readFileSync(referenceSongPath, "utf8"));
const outputRoot = resolve(projectRoot, "output");

export default {
  title: "Tutorial #1 - Crear una canción con Script",
  baseUrl: process.env.BASE_URL || "http://127.0.0.1:5173",
  goal: buildTutorialGoal(referenceSong),
  referenceSongPath,
  referenceSong,
  phases: buildTutorialPhases(referenceSong),
  presetFlow: buildPresetFlow(referenceSong),
  maxSteps: 12,
  headless: process.env.HEADLESS === "true",
  allowedActions: ["click", "type", "select", "scroll", "wait"],
  branding: {
    logoPath: "../../src/asset/gse_logo_1024x1024.png",
    introEyebrow: "Group Sheet Editor",
    introTitle: "Aprende a crear una canción con Script",
    introBody:
      "En esta guía verás cómo construir Dark End Of Street desde la función Script, escribiendo primero las secciones, después la estructura y al final las letras.",
  },
  appendixSlides: [
    {
      id: "script-syntax-reference",
      eyebrow: "Referencia final",
      title: "Sintaxis completa del Script",
      phaseTitle: "Pseudo codigo",
      body:
        "Esta hoja final resume la sintaxis completa del pseudo codigo del Script para que puedas usarla como referencia rapida mientras editas canciones.",
      codeSnippet: `Sections:
ID=|compas1|compas2|...|xN

Notacion dentro de un compas:
- Barras |...| delimitan cada compas
- Comas separan varios acordes dentro del mismo compas
- Duraciones:
  C      redonda
  C.     negra
  C..    blanca
  C...   blanca con puntillo
- Especiales:
  %      repite el acorde anterior
  _      silencio
  /      compas de salto de linea visual
- xN al final de la seccion indica repeticiones

Ejemplo:
A=|G..,F#m..|Em|G..,C.,D.|G|x2

Structure:
ID,ID,ID,/,ID

Reglas:
- Usa IDs definidos en Sections
- / inserta un salto de linea visual

Ejemplo:
In,A,A,B,C

Lyrics:
ID=Texto
ID=Texto siguiente

Reglas:
- Cada entrada empieza por ID=
- Puedes escribir texto en varias lineas
- Si una seccion aparece varias veces en Structure, añade varias entradas Lyrics para ese mismo ID en el mismo orden

Ejemplo:
Lyrics:
In=
A=Primera vuelta
A=Segunda vuelta
B=Puente
C=Final`,
    },
  ],
  observer: {
    textLimit: 2600,
    elementLimit: 36,
  },
  browser: {
    name: "chromium",
    viewport: {
      width: 1440,
      height: 1024,
    },
    slowMoMs: 180,
  },
  llm: {
    provider: "openai",
    apiKey: process.env.OPENAI_API_KEY || "replace-with-your-api-key",
    model: process.env.OPENAI_MODEL || "gpt-5",
    temperature: 0.2,
    maxOutputTokens: 450,
    allowHeuristicFallback: true,
  },
  safety: {
    navigationTimeoutMs: 15000,
    actionTimeoutMs: 12000,
    idleTimeoutMs: 900,
    resetStorage: true,
    initialWaitMs: 5600,
  },
  capture: {
    screenshotWidth: 800,
    gifFps: 10,
    gifHoldBeforeMs: 0.9,
    gifHoldAfterMs: 1.35,
  },
  output: {
    rootDir: outputRoot,
    rawDir: resolve(outputRoot, "raw"),
    gifsDir: resolve(outputRoot, "gifs"),
    debugDir: resolve(outputRoot, "debug"),
    videosDir: resolve(outputRoot, "videos"),
    tutorialHtmlPath: resolve(outputRoot, "tutorial.html"),
    tutorialDataPath: resolve(outputRoot, "tutorial-data.json"),
  },
};
