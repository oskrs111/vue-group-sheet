async function waitForIdle(page, config) {
  const idleTimeoutMs = config.safety?.idleTimeoutMs ?? 900;

  try {
    await page.waitForLoadState("networkidle", { timeout: idleTimeoutMs });
  } catch {
    await page.waitForTimeout(idleTimeoutMs);
  }
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function describeTarget(target = {}, fallbackSelector = "") {
  if (target.role && target.textIncludes) {
    return `role=${target.role}[text*="${target.textIncludes}"]`;
  }

  if (target.placeholderIncludes) {
    return `placeholder*="${target.placeholderIncludes}"`;
  }

  if (target.type) {
    return `type=${target.type}`;
  }

  return fallbackSelector;
}

function resolveLocator(page, decision) {
  if (decision.target?.role && decision.target?.textIncludes) {
    return page
      .getByRole(decision.target.role, {
        name: new RegExp(escapeRegExp(decision.target.textIncludes), "i"),
      })
      .first();
  }

  if (decision.target?.placeholderIncludes) {
    return page
      .getByPlaceholder(new RegExp(escapeRegExp(decision.target.placeholderIncludes), "i"))
      .first();
  }

  if (decision.target?.type === "textarea") {
    return page.locator("textarea").first();
  }

  if (decision.selector) {
    return page.locator(decision.selector).first();
  }

  return null;
}

async function revealTextareaPosition(locator, revealText) {
  if (!locator || !revealText) return;

  await locator.evaluate((element, marker) => {
    const text = String(marker || "");
    const value = element.value || "";
    const index = value.indexOf(text);
    element.focus();

    if (index >= 0 && typeof element.setSelectionRange === "function") {
      element.setSelectionRange(index, index);
      const before = value.slice(0, index);
      const lineIndex = before.split("\n").length - 1;
      const lineHeight = Number.parseFloat(window.getComputedStyle(element).lineHeight) || 20;
      element.scrollTop = Math.max(0, (lineIndex - 2) * lineHeight);
    } else {
      element.scrollTop = 0;
    }
  }, revealText);
}

async function withRetry(action, retries = 2) {
  let lastError = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await action();
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

export async function executeAction(page, decision, config) {
  const timeout = config.safety?.actionTimeoutMs ?? 12000;
  const locator = resolveLocator(page, decision);

  try {
    switch (decision.action) {
      case "click":
        await withRetry(() => locator.click({ timeout }));
        break;

      case "type":
        await withRetry(async () => {
          await locator.click({ timeout });
          await locator.fill("", { timeout });
          await locator.fill(decision.value || "", { timeout });
          await revealTextareaPosition(locator, decision.revealText);
        });
        break;

      case "select":
        await withRetry(async () => {
          await locator.selectOption({ label: decision.value }, { timeout }).catch(async () => {
            await locator.selectOption({ value: decision.value }, { timeout });
          });
        });
        break;

      case "scroll":
        await page.mouse.wheel(0, Number(decision.value || 520));
        break;

      case "wait":
      default:
        await page.waitForTimeout(Number(decision.value || 850));
        break;
    }

    await waitForIdle(page, config);

    return {
      ok: true,
      action: decision.action,
      resolvedTarget: describeTarget(decision.target, decision.selector),
    };
  } catch (error) {
    return {
      ok: false,
      action: decision.action,
      resolvedTarget: describeTarget(decision.target, decision.selector),
      error: error.message,
    };
  }
}
