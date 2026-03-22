import crypto from "node:crypto";

function hashValue(value) {
  return crypto.createHash("sha1").update(String(value)).digest("hex");
}

export class AgentMemory {
  constructor() {
    this.stepsHistory = [];
    this.visitedStates = new Set();
    this.actionFingerprints = [];
    this.actionFingerprintSet = new Set();
    this.noopStreakByPhase = new Map();
  }

  buildActionFingerprint(phaseId, stateHash, action) {
    return hashValue(
      JSON.stringify({
        phaseId,
        stateHash,
        action: action.action,
        selector: action.selector || "",
        value: action.value || "",
      }),
    );
  }

  hasActionFingerprint(phaseId, stateHash, action) {
    return this.actionFingerprintSet.has(this.buildActionFingerprint(phaseId, stateHash, action));
  }

  recordStep(step) {
    this.stepsHistory.push(step);
    this.visitedStates.add(step.afterStateHash);

    const fingerprint = this.buildActionFingerprint(step.phaseId, step.beforeStateHash, step.actionPayload);
    this.actionFingerprintSet.add(fingerprint);
    this.actionFingerprints.push(fingerprint);

    if (step.beforeStateHash === step.afterStateHash) {
      const nextValue = (this.noopStreakByPhase.get(step.phaseId) || 0) + 1;
      this.noopStreakByPhase.set(step.phaseId, nextValue);
    } else {
      this.noopStreakByPhase.set(step.phaseId, 0);
    }
  }

  getNoopStreak(phaseId) {
    return this.noopStreakByPhase.get(phaseId) || 0;
  }

  getVisitedStateCount() {
    return this.visitedStates.size;
  }

  getRecentSteps(limit = 6) {
    return this.stepsHistory.slice(-limit).map((step) => ({
      id: step.id,
      phaseId: step.phaseId,
      description: step.description,
      action: step.action,
      selector: step.selector,
      outcome: step.execution?.ok ? "ok" : "error",
    }));
  }

  getRecentActionFingerprints(limit = 8) {
    return this.actionFingerprints.slice(-limit);
  }
}
