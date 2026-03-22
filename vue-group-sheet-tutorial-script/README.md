# Vue Group Sheet Tutorial

Submódulo independiente para generar tutoriales animados de uso de Group Sheet Editor mediante un agente autónomo que explora la UI, decide acciones, captura pasos y sintetiza un `tutorial.html`.

## Qué incluye

- Runner Node con bucle de agente:
  - observación del DOM
  - memoria de estados y acciones
  - decisión guiada por LLM
  - ejecución con Playwright
  - captura de pantallas por paso
- Postproceso:
  - GIF por paso con `ffmpeg-static`
  - `tutorial-data.json`
  - `tutorial.html`
- UI en Vue:
  - resumen del flujo
  - referencia de `Dark End Of Street.txt`
  - visor ligero para un `tutorial-data.json` generado

## Estructura

```text
vue-group-sheet-tutorial/
  agent/
    controller.js
    decision.js
    memory.js
    observer.js
    prompt.js
  automation/
    actions.js
    recorder.js
  config/
    example.config.mjs
  output/
    raw/
    gifs/
    debug/
    videos/
  postprocess/
    gifs.js
    html.js
  shared/
    fs-utils.js
    logger.js
    referenceSongParser.js
    tutorialPhases.js
  src/
    App.vue
    ...
  run-agent.mjs
  Dark End Of Street.txt
```

## Prompt de decisión

El prompt está definido en `agent/prompt.js`. El motor recibe:

- objetivo global
- fase activa
- resumen del estado actual
- historial reciente
- fragmento relevante de la canción de referencia

El modelo debe devolver JSON con:

- `action`
- `selector`
- `value`
- `description`
- `phaseComplete`
- `confidence`

## Configuración

1. Copia `.env.example` como `.env`.
2. Ajusta como mínimo:

```bash
BASE_URL=http://127.0.0.1:5173
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-5
HEADLESS=false
```

## Instalación

Desde `vue-group-sheet-tutorial/`:

```bash
npm install
```

## Ejecución

1. Arranca la app principal `vue-group-sheet`.
2. Desde este submódulo:

```bash
npm run tutorial:run
```

El runner generará:

- `output/raw/*.png`
- `output/gifs/*.gif`
- `output/tutorial-data.json`
- `output/tutorial.html`

## UI en Vue

Para abrir la interfaz auxiliar:

```bash
npm run dev
```

La UI no ejecuta el agente. Sirve para:

- revisar la canción de referencia
- inspeccionar las fases
- cargar un `tutorial-data.json` generado

## Notas importantes

- El ejemplo está orientado a `Dark End Of Street.txt`.
- La secuencia del tutorial está fijada en tres fases: `Sections`, `Structure`, `Lyrics`.
- No se fuerzan selectores concretos; el agente trabaja con detección genérica de elementos visibles.
- Si el modelo falla o no hay API key válida, el sistema entra en un fallback heurístico básico.
