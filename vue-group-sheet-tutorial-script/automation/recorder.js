import { rm } from "node:fs/promises";
import { join, relative } from "node:path";
import { ensureDir, writeJson, slugify } from "../shared/fs-utils.js";

function toRelative(fromDir, filePath) {
  return relative(fromDir, filePath).replace(/\\/g, "/");
}

export class StepRecorder {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.steps = [];
    this.stepCounter = 0;
  }

  async initialize() {
    await rm(this.config.output.rawDir, { recursive: true, force: true });
    await rm(this.config.output.gifsDir, { recursive: true, force: true });
    await rm(this.config.output.debugDir, { recursive: true, force: true });
    await rm(this.config.output.videosDir, { recursive: true, force: true });
    await ensureDir(this.config.output.rawDir);
    await ensureDir(this.config.output.gifsDir);
    await ensureDir(this.config.output.debugDir);
    await ensureDir(this.config.output.videosDir);
  }

  async startStep(page, phase, stateBefore) {
    this.stepCounter += 1;
    const safePhase = slugify(phase.id);
    const id = `step-${String(this.stepCounter).padStart(3, "0")}`;
    const baseName = `${String(phase.order).padStart(2, "0")}-${safePhase}-${id}`;
    const beforeScreenshotPath = join(this.config.output.rawDir, `${baseName}-before.png`);

    await page.screenshot({
      path: beforeScreenshotPath,
      fullPage: false,
      animations: "disabled",
    });

    return {
      id,
      baseName,
      phase,
      stateBefore,
      beforeScreenshotPath,
    };
  }

  async finishStep(page, pendingStep, payload) {
    const afterScreenshotPath = join(this.config.output.rawDir, `${pendingStep.baseName}-after.png`);
    await page.screenshot({
      path: afterScreenshotPath,
      fullPage: false,
      animations: "disabled",
    });

    const stepNumber = this.steps.length + 1;
    const step = {
      id: pendingStep.id,
      stepNumber,
      phaseId: pendingStep.phase.id,
      phaseTitle: pendingStep.phase.title,
      title: `${pendingStep.phase.title} ${stepNumber}`,
      description: payload.action.description,
      lessonTitle: payload.lesson?.title || `${pendingStep.phase.title} ${stepNumber}`,
      lessonText: payload.lesson?.lessonText || payload.action.description,
      codeSnippet: payload.lesson?.codeSnippet || "",
      action: payload.action.action,
      selector: payload.action.selector,
      value: payload.action.value,
      actionPayload: payload.action,
      execution: payload.execution,
      beforeStateHash: pendingStep.stateBefore.hash,
      afterStateHash: payload.stateAfter.hash,
      beforeScreenshotPath: pendingStep.beforeScreenshotPath,
      afterScreenshotPath,
      beforeScreenshotRelative: toRelative(this.config.output.rootDir, pendingStep.beforeScreenshotPath),
      afterScreenshotRelative: toRelative(this.config.output.rootDir, afterScreenshotPath),
      gifPath: null,
      timestamp: new Date().toISOString(),
    };

    this.steps.push(step);
    await this.persistManifest();
    this.logger.info("Paso registrado", { id: step.id, action: step.action, phase: step.phaseId });
    return step;
  }

  async persistManifest() {
    await writeJson(join(this.config.output.debugDir, "steps.raw.json"), this.steps);
  }
}
