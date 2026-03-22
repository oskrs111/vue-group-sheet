import "dotenv/config";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { chromium, firefox, webkit } from "playwright";
import { createLogger } from "./shared/logger.js";
import { StepRecorder } from "./automation/recorder.js";
import { createDecisionEngine } from "./agent/decision.js";
import { runTutorialController } from "./agent/controller.js";
import { generateStepGifs } from "./postprocess/gifs.js";
import { generateTutorialHtml } from "./postprocess/html.js";

const logger = createLogger("tutorial-runner");

function getArgValue(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

async function loadConfig() {
  const configPath = resolve(process.cwd(), getArgValue("--config", "./config/example.config.mjs"));
  const moduleUrl = pathToFileURL(configPath).href;
  const loaded = await import(moduleUrl);
  return loaded.default || loaded.config;
}

async function launchBrowser(config) {
  const mapping = { chromium, firefox, webkit };
  const browserType = mapping[config.browser?.name || "chromium"] || chromium;

  return browserType.launch({
    headless: config.headless,
    slowMo: config.browser?.slowMoMs || 0,
  });
}

async function main() {
  const config = await loadConfig();
  const browser = await launchBrowser(config);
  const context = await browser.newContext({
    viewport: config.browser?.viewport,
  });
  const page = await context.newPage();

  try {
    const recorder = new StepRecorder(config, logger);
    await recorder.initialize();

    const decisionEngine = createDecisionEngine(config, logger);
    const result = await runTutorialController({
      page,
      config,
      recorder,
      decisionEngine,
      logger,
    });

    await generateStepGifs(result.steps, config, logger);
    await generateTutorialHtml(config, result.steps);
    logger.info("Tutorial generado", { html: config.output.tutorialHtmlPath });
  } finally {
    await context.close();
    await browser.close();
  }
}

main().catch((error) => {
  logger.error("Fallo en la ejecución del tutorial", { message: error.message });
  process.exitCode = 1;
});
