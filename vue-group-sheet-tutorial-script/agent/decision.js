import OpenAI from "openai";
import { SYSTEM_PROMPT, buildDecisionInput } from "./prompt.js";

const DECISION_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    action: {
      type: "string",
      enum: ["click", "type", "select", "scroll", "wait"],
    },
    selector: {
      type: "string",
    },
    value: {
      type: "string",
    },
    description: {
      type: "string",
    },
    phaseComplete: {
      type: "boolean",
    },
    confidence: {
      type: "number",
      minimum: 0,
      maximum: 1,
    },
  },
  required: ["action", "selector", "value", "description", "phaseComplete", "confidence"],
};

function hasUsableApiKey(apiKey) {
  return Boolean(apiKey) && !String(apiKey).includes("replace-with-your-api-key");
}

function normalizeDecision(decision) {
  return {
    action: decision.action || "wait",
    selector: decision.selector || "",
    value: decision.value || "",
    description: decision.description || "Esperar a que cambie la interfaz.",
    phaseComplete: Boolean(decision.phaseComplete),
    confidence: Number.isFinite(decision.confidence) ? decision.confidence : 0.5,
  };
}

function chooseBestElement(elements, phase) {
  const keywords = `${phase.title} ${phase.goal}`
    .toLowerCase()
    .split(/[^a-z0-9áéíóúñ]+/i)
    .filter(Boolean);

  let best = null;

  for (const element of elements) {
    const haystack = `${element.text} ${element.placeholder} ${element.label}`.toLowerCase();
    const score = keywords.reduce((total, keyword) => (haystack.includes(keyword) ? total + 1 : total), 0);
    if (!best || score > best.score) {
      best = { element, score };
    }
  }

  return best?.element || elements[0] || null;
}

function decideHeuristically({ phase, state }) {
  const visibleText = state.visibleText.toLowerCase();
  const allTokensVisible =
    phase.completionMode === "visibleTokens" &&
    (phase.expectedVisibleText || []).length > 0 &&
    (phase.expectedVisibleText || []).every((token) => visibleText.includes(String(token).toLowerCase()));

  if (allTokensVisible && phase.id !== "structure") {
    return normalizeDecision({
      action: "wait",
      selector: "",
      value: "300",
      description: `La fase ${phase.title} parece completa.`,
      phaseComplete: true,
      confidence: 0.55,
    });
  }

  const bestButton = chooseBestElement(state.buttons, phase);
  if (bestButton && !bestButton.disabled) {
    return normalizeDecision({
      action: "click",
      selector: bestButton.selector,
      value: "",
      description: `Interactuar con "${bestButton.text || bestButton.label || bestButton.placeholder}" para avanzar en ${phase.title}.`,
      phaseComplete: false,
      confidence: 0.35,
    });
  }

  const bestInput = chooseBestElement(state.inputs, phase);
  if (bestInput && !bestInput.disabled) {
    const defaultValue =
      phase.id === "lyrics"
        ? "Dark End Of Street"
        : phase.id === "structure"
          ? "A"
          : "In";

    return normalizeDecision({
      action: "type",
      selector: bestInput.selector,
      value: defaultValue,
      description: `Escribir un valor de ejemplo en "${bestInput.placeholder || bestInput.text || bestInput.label}".`,
      phaseComplete: false,
      confidence: 0.25,
    });
  }

  return normalizeDecision({
    action: "scroll",
    selector: "",
    value: "520",
    description: "Desplazarse para descubrir más elementos interactivos.",
    phaseComplete: false,
    confidence: 0.2,
  });
}

async function decideWithOpenAI(client, config, params) {
  const response = await client.responses.create({
    model: config.llm.model,
    instructions: SYSTEM_PROMPT,
    input: JSON.stringify(buildDecisionInput(params), null, 2),
    temperature: config.llm.temperature ?? 0.2,
    max_output_tokens: config.llm.maxOutputTokens || 450,
    text: {
      format: {
        type: "json_schema",
        name: "agent_decision",
        schema: DECISION_SCHEMA,
        strict: true,
      },
    },
  });

  return normalizeDecision(JSON.parse(response.output_text));
}

export function createDecisionEngine(config, logger) {
  const client = hasUsableApiKey(config.llm?.apiKey)
    ? new OpenAI({ apiKey: config.llm.apiKey })
    : null;

  return async function decideNextAction(params) {
    if (client) {
      try {
        return await decideWithOpenAI(client, config, params);
      } catch (error) {
        logger.warn("Fallo en decisión con OpenAI; usando heurística.", { message: error.message });
        if (!config.llm?.allowHeuristicFallback) {
          throw error;
        }
      }
    }

    return decideHeuristically(params);
  };
}
