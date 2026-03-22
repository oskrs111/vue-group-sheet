import { writeJson, writeText } from "../shared/fs-utils.js";

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildSlides(config, steps) {
  const introSlide = {
    id: "slide-intro",
    kind: "intro",
    title: config.branding?.introTitle || config.title,
    eyebrow: config.branding?.introEyebrow || "Tutorial",
    body: config.branding?.introBody || config.goal,
    logoPath: config.branding?.logoPath || "",
  };

  const stepSlides = steps.map((step, index) => ({
    id: step.id,
    kind: "step",
    title: step.lessonTitle || step.title,
    eyebrow: `Paso ${index + 1} de ${steps.length}`,
    body: step.lessonText || step.description,
    phaseTitle: step.phaseTitle,
    gifPath: step.gifPath,
    codeSnippet: step.codeSnippet || "",
  }));

  const appendixSlides = (config.appendixSlides || []).map((slide, index) => ({
    id: slide.id || `appendix-${index + 1}`,
    kind: slide.kind || "appendix",
    title: slide.title || `Referencia ${index + 1}`,
    eyebrow: slide.eyebrow || "Referencia final",
    body: slide.body || "",
    phaseTitle: slide.phaseTitle || "Sintaxis",
    gifPath: slide.gifPath || "",
    codeSnippet: slide.codeSnippet || "",
  }));

  return [introSlide, ...stepSlides, ...appendixSlides];
}

function buildTutorialData(config, steps) {
  const slides = buildSlides(config, steps);

  return {
    meta: {
      title: config.title,
      generatedAt: new Date().toISOString(),
    },
    slides,
    steps: steps.map((step) => ({
      id: step.id,
      phaseId: step.phaseId,
      phaseTitle: step.phaseTitle,
      title: step.lessonTitle || step.title,
      description: step.lessonText || step.description,
      gifPath: step.gifPath,
      codeSnippet: step.codeSnippet || "",
    })),
  };
}

function buildSlideMarkup(slide, index, totalSlides) {
  if (slide.kind === "intro") {
    return `
      <section class="slide" data-slide-index="${index}">
        <div class="slide-shell slide-shell--intro">
          <div class="intro-copy">
            <p class="eyebrow">${escapeHtml(slide.eyebrow)}</p>
            <h1>${escapeHtml(slide.title)}</h1>
            <p class="slide-text">${escapeHtml(slide.body)}</p>
            <div class="intro-footer">Slide ${index + 1} / ${totalSlides}</div>
          </div>
          <div class="intro-media">
            ${slide.logoPath ? `<img class="intro-logo" src="${escapeHtml(slide.logoPath)}" alt="Group Sheet Editor logo" />` : ""}
          </div>
        </div>
      </section>
    `;
  }

  const mediaMarkup = slide.gifPath
    ? `
        <div class="slide-media">
          <img src="${escapeHtml(slide.gifPath)}" alt="${escapeHtml(slide.title)}" />
        </div>
      `
    : "";

  return `
    <section class="slide" data-slide-index="${index}">
      <div class="slide-shell ${slide.gifPath ? "" : "slide-shell--text-only"}">
        <div class="slide-header">
          <div>
            <p class="eyebrow">${escapeHtml(slide.eyebrow)}</p>
            <h2>${escapeHtml(slide.title)}</h2>
          </div>
          <div class="phase-chip">${escapeHtml(slide.phaseTitle || "")}</div>
        </div>

        ${mediaMarkup}

        <div class="slide-caption">
          <p class="slide-text">${escapeHtml(slide.body)}</p>
          ${slide.codeSnippet ? `<pre class="code-block">${escapeHtml(slide.codeSnippet)}</pre>` : ""}
        </div>
      </div>
    </section>
  `;
}

function buildHtml(config, tutorialData) {
  const slidesMarkup = tutorialData.slides
    .map((slide, index) => buildSlideMarkup(slide, index, tutorialData.slides.length))
    .join("");

  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(config.title)}</title>
    <style>
      :root {
        color-scheme: dark;
        --bg: #050a13;
        --panel: rgba(7, 16, 30, 0.92);
        --panel-border: rgba(148, 163, 184, 0.16);
        --accent: #f59e0b;
        --accent-soft: rgba(245, 158, 11, 0.14);
        --secondary: #7dd3fc;
        --text: #f8fafc;
        --muted: #cbd5e1;
      }
      * { box-sizing: border-box; }
      html, body {
        margin: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
        font-family: "Segoe UI", sans-serif;
        color: var(--text);
        background:
          radial-gradient(circle at top left, rgba(125, 211, 252, 0.16), transparent 24%),
          radial-gradient(circle at right, rgba(245, 158, 11, 0.18), transparent 20%),
          linear-gradient(180deg, #08111d 0%, #030712 100%);
      }
      body {
        position: relative;
        display: grid;
        grid-template-rows: minmax(0, 1fr) auto;
      }
      .slides {
        width: 100vw;
        min-height: 0;
        position: relative;
      }
      .slide {
        position: absolute;
        inset: 0;
        padding: 28px 28px 12px;
        display: none;
      }
      .slide.is-active {
        display: block;
      }
      .slide-shell {
        width: 100%;
        height: 100%;
        border: 1px solid var(--panel-border);
        border-radius: 28px;
        background: var(--panel);
        backdrop-filter: blur(20px);
        box-shadow: 0 28px 70px rgba(0, 0, 0, 0.28);
        display: grid;
        grid-template-rows: auto minmax(0, 1fr) auto;
        gap: 18px;
        padding: 24px;
      }
      .slide-shell--intro {
        grid-template-columns: minmax(0, 1.1fr) minmax(320px, 0.9fr);
        grid-template-rows: 1fr;
        align-items: center;
        gap: 24px;
      }
      .slide-shell--text-only {
        grid-template-rows: auto auto minmax(0, 1fr);
      }
      .eyebrow {
        margin: 0 0 10px;
        color: var(--secondary);
        text-transform: uppercase;
        letter-spacing: 0.14em;
        font-size: 0.72rem;
      }
      h1 {
        margin: 0 0 16px;
        font-size: clamp(3rem, 4.5vw, 5rem);
        line-height: 0.95;
        letter-spacing: -0.06em;
      }
      h2 {
        margin: 0;
        font-size: clamp(2rem, 3vw, 3rem);
        letter-spacing: -0.04em;
      }
      .intro-copy,
      .slide-caption {
        display: grid;
        gap: 18px;
      }
      .slide-text {
        margin: 0;
        color: var(--muted);
        font-size: 1.05rem;
        line-height: 1.7;
      }
      .intro-media,
      .slide-media {
        min-height: 0;
        border-radius: 24px;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(148, 163, 184, 0.12);
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      }
      .intro-logo {
        width: min(72vh, 460px);
        max-width: 100%;
        object-fit: contain;
        filter: drop-shadow(0 0 50px rgba(96, 165, 250, 0.28));
      }
      .slide-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 16px;
      }
      .phase-chip {
        border-radius: 999px;
        background: var(--accent-soft);
        color: var(--accent);
        padding: 8px 12px;
        font-size: 0.82rem;
        font-weight: 600;
        white-space: nowrap;
      }
      .slide-media img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        display: block;
      }
      .code-block {
        margin: 0;
        max-height: min(54vh, 560px);
        overflow: auto;
        padding: 14px 16px;
        border-radius: 18px;
        background: rgba(2, 6, 23, 0.78);
        border: 1px solid rgba(125, 211, 252, 0.14);
        color: #e2e8f0;
        font-family: "Consolas", "JetBrains Mono", monospace;
        font-size: 0.9rem;
        line-height: 1.55;
        white-space: pre-wrap;
      }
      .intro-footer {
        color: var(--secondary);
        font-size: 0.9rem;
      }
      .controls {
        display: flex;
        align-items: center;
        justify-self: center;
        gap: 12px;
        margin: 0 0 18px;
        padding: 10px 14px;
        border-radius: 999px;
        background: rgba(2, 6, 23, 0.78);
        border: 1px solid rgba(148, 163, 184, 0.14);
        box-shadow: 0 14px 36px rgba(0, 0, 0, 0.28);
      }
      .controls button {
        border: 0;
        border-radius: 999px;
        padding: 10px 16px;
        cursor: pointer;
        font: inherit;
        font-weight: 600;
        background: rgba(255, 255, 255, 0.08);
        color: var(--text);
      }
      .controls button:hover {
        background: rgba(255, 255, 255, 0.14);
      }
      .counter {
        min-width: 92px;
        text-align: center;
        color: var(--muted);
      }
      @media (max-width: 980px) {
        .slide {
          padding: 16px 16px 10px;
        }
        .slide-shell {
          padding: 18px;
        }
        .slide-shell--intro {
          grid-template-columns: 1fr;
          grid-template-rows: auto 1fr;
        }
        .slide-shell--text-only {
          grid-template-rows: auto auto minmax(0, 1fr);
        }
        .controls {
          margin-bottom: 12px;
        }
      }
    </style>
  </head>
  <body>
    <main class="slides">
      ${slidesMarkup}
    </main>

    <nav class="controls" aria-label="Navegación del tutorial">
      <button type="button" id="prevBtn">Anterior</button>
      <div class="counter" id="slideCounter"></div>
      <button type="button" id="nextBtn">Siguiente</button>
    </nav>

    <script>
      const slides = Array.from(document.querySelectorAll(".slide"));
      const counter = document.getElementById("slideCounter");
      const prevBtn = document.getElementById("prevBtn");
      const nextBtn = document.getElementById("nextBtn");
      let currentIndex = 0;

      function renderSlide() {
        slides.forEach((slide, index) => {
          slide.classList.toggle("is-active", index === currentIndex);
        });

        counter.textContent = (currentIndex + 1) + " / " + slides.length;
        prevBtn.disabled = currentIndex === 0;
        nextBtn.disabled = currentIndex === slides.length - 1;
      }

      prevBtn.addEventListener("click", () => {
        currentIndex = Math.max(0, currentIndex - 1);
        renderSlide();
      });

      nextBtn.addEventListener("click", () => {
        currentIndex = Math.min(slides.length - 1, currentIndex + 1);
        renderSlide();
      });

      window.addEventListener("keydown", (event) => {
        if (event.key === "ArrowRight") {
          currentIndex = Math.min(slides.length - 1, currentIndex + 1);
          renderSlide();
        }
        if (event.key === "ArrowLeft") {
          currentIndex = Math.max(0, currentIndex - 1);
          renderSlide();
        }
      });

      renderSlide();
    </script>
  </body>
</html>`;
}

export async function generateTutorialHtml(config, steps) {
  const tutorialData = buildTutorialData(config, steps);
  const html = buildHtml(config, tutorialData);

  await writeJson(config.output.tutorialDataPath, tutorialData);
  await writeText(config.output.tutorialHtmlPath, html);

  return tutorialData;
}
