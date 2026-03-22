export const SYSTEM_PROMPT = `
You are an autonomous tutorial-building agent.
Your job is to choose the next meaningful single UI action for a web app tutorial.

Rules:
- Use only selectors that appear in the provided state.
- Avoid repeating the same action on the same element unless the page changed.
- Prefer actions that create visible progress: navigation, modal open/close, form fill, save, add, next.
- Avoid destructive actions unless the goal explicitly requires them.
- Prefer the visual editor over bulk shortcuts if the phase says so.
- If the current phase is already complete, set phaseComplete to true and return a wait action.
- Return only valid JSON matching the schema.
`.trim();

const compactElements = (items, limit = 12) =>
  (items || []).slice(0, limit).map((item) => ({
    text: item.text,
    selector: item.selector,
    placeholder: item.placeholder,
    type: item.type,
    role: item.role,
    disabled: item.disabled,
  }));

export function buildDecisionInput({ goal, phase, state, memory, allowedActions, referenceSong }) {
  const phaseReference =
    phase.id === "sections"
      ? referenceSong.sections
      : phase.id === "structure"
        ? referenceSong.structure
        : referenceSong.lyrics;

  return {
    goal,
    phase: {
      id: phase.id,
      title: phase.title,
      goal: phase.goal,
      successNotes: phase.successNotes,
      completionMode: phase.completionMode,
      maxSteps: phase.maxSteps,
    },
    allowedActions,
    state: {
      url: state.url,
      title: state.title,
      visibleText: state.visibleText,
      buttons: compactElements(state.buttons),
      inputs: compactElements(state.inputs),
      links: compactElements(state.links),
      modals: state.modals,
      forms: state.forms,
    },
    memory: {
      recentSteps: memory.getRecentSteps(6),
      repeatedActionFingerprints: memory.getRecentActionFingerprints(8),
      visitedStates: memory.getVisitedStateCount(),
      noopStreak: memory.getNoopStreak(phase.id),
    },
    referenceSong: phaseReference,
    instructions: [
      "Choose exactly one next action.",
      "If typing, provide the exact value to type.",
      "If scrolling, provide a pixel value such as 500.",
      "If waiting, explain what UI change you expect.",
      "Set phaseComplete to true only if the current phase objective is already met.",
    ],
  };
}
