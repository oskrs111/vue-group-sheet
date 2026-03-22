import { executeAction } from "../automation/actions.js";
import { AgentMemory } from "./memory.js";
import { observePage } from "./observer.js";

function phaseLooksComplete(state, phase) {
  if (phase.completionMode !== "visibleTokens") {
    return false;
  }

  const tokens = phase.expectedVisibleText || [];
  if (tokens.length === 0) {
    return false;
  }

  const visibleText = state.visibleText.toLowerCase();
  return tokens.every((token) => visibleText.includes(String(token).toLowerCase()));
}

function buildFallbackAction(phase) {
  return {
    action: "scroll",
    selector: "",
    value: "520",
    description: `Desplazarse para descubrir más interfaz durante la fase ${phase.title}.`,
    phaseComplete: false,
    confidence: 0.1,
  };
}

function matchesTarget(element, target = {}) {
  if (!element) return false;

  const text = `${element.text || ""} ${element.label || ""}`.toLowerCase();
  const placeholder = `${element.placeholder || ""}`.toLowerCase();
  const type = `${element.type || ""} ${element.tag || ""}`.toLowerCase();

  if (target.role && element.role !== target.role && element.type !== target.role) {
    return false;
  }

  if (target.textIncludes && !text.includes(String(target.textIncludes).toLowerCase())) {
    return false;
  }

  if (target.placeholderIncludes && !placeholder.includes(String(target.placeholderIncludes).toLowerCase())) {
    return false;
  }

  if (target.type && !type.includes(String(target.type).toLowerCase())) {
    return false;
  }

  return true;
}

function resolvePresetAction(planStep, state) {
  const action = { ...planStep.action };
  const target = action.target;

  if (!target) {
    return action;
  }

  const candidates = state.interactive || [];
  const match = candidates.find((element) => matchesTarget(element, target));

  if (!match) {
    throw new Error(`No se encontró un elemento para el paso "${planStep.id}"`);
  }

  action.selector = match.selector;
  return action;
}

async function runPresetFlow({ page, config, recorder, logger }) {
  await page.goto(config.baseUrl, {
    waitUntil: "domcontentloaded",
    timeout: config.safety?.navigationTimeoutMs ?? 15000,
  });

  if (config.safety?.resetStorage) {
    await page.evaluate(() => window.localStorage.clear());
    await page.reload({ waitUntil: "domcontentloaded" });
  }

  if (config.safety?.initialWaitMs) {
    await page.waitForTimeout(config.safety.initialWaitMs);
  }

  for (const planStep of config.presetFlow || []) {
    const phase = config.phases.find((item) => item.id === planStep.phaseId) || {
      id: planStep.phaseId,
      title: planStep.phaseId,
      order: 99,
    };

    logger.info("Ejecutando paso guiado", { id: planStep.id, phase: phase.id });
    const stateBefore = await observePage(page, config);
    const resolvedAction = resolvePresetAction(planStep, stateBefore);
    const pendingStep = await recorder.startStep(page, phase, stateBefore);
    const execution = await executeAction(page, resolvedAction, config);
    const stateAfter = await observePage(page, config);

    await recorder.finishStep(page, pendingStep, {
      action: resolvedAction,
      execution,
      stateAfter,
      lesson: planStep,
    });
  }

  return {
    steps: recorder.steps,
    memory: null,
  };
}

export async function runTutorialController({ page, config, recorder, decisionEngine, logger }) {
  if (config.presetFlow?.length) {
    return runPresetFlow({ page, config, recorder, logger });
  }

  const memory = new AgentMemory();

  await page.goto(config.baseUrl, {
    waitUntil: "domcontentloaded",
    timeout: config.safety?.navigationTimeoutMs ?? 15000,
  });

  if (config.safety?.resetStorage) {
    await page.evaluate(() => window.localStorage.clear());
    await page.reload({ waitUntil: "domcontentloaded" });
  }

  if (config.safety?.initialWaitMs) {
    await page.waitForTimeout(config.safety.initialWaitMs);
  }

  let totalSteps = 0;

  for (const phase of config.phases) {
    logger.info("Iniciando fase", { phase: phase.id });
    let stepsInPhase = 0;

    while (stepsInPhase < phase.maxSteps && totalSteps < config.maxSteps) {
      const stateBefore = await observePage(page, config);

      if (stepsInPhase > 0 && phaseLooksComplete(stateBefore, phase)) {
        logger.info("Fase completada por heurística", { phase: phase.id });
        break;
      }

      let decision = await decisionEngine({
        goal: config.goal,
        phase,
        state: stateBefore,
        memory,
        allowedActions: config.allowedActions,
        referenceSong: config.referenceSong,
      });

      if (memory.hasActionFingerprint(phase.id, stateBefore.hash, decision)) {
        decision = buildFallbackAction(phase);
      }

      if (decision.phaseComplete && stepsInPhase > 0) {
        logger.info("Fase completada por el motor de decisión", { phase: phase.id });
        break;
      }

      const pendingStep = await recorder.startStep(page, phase, stateBefore);
      const execution = await executeAction(page, decision, config);
      const stateAfter = await observePage(page, config);

      const step = await recorder.finishStep(page, pendingStep, {
        action: decision,
        execution,
        stateAfter,
      });

      memory.recordStep(step);
      stepsInPhase += 1;
      totalSteps += 1;

      if (!execution.ok && memory.getNoopStreak(phase.id) >= 2) {
        logger.warn("Fase detenida por falta de progreso", { phase: phase.id });
        break;
      }

      if (phaseLooksComplete(stateAfter, phase) && stepsInPhase > 0) {
        logger.info("Fase completada tras la acción", { phase: phase.id });
        break;
      }
    }
  }

  return {
    steps: recorder.steps,
    memory,
  };
}
