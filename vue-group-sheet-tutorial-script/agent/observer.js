import crypto from "node:crypto";

function hashState(value) {
  return crypto.createHash("sha1").update(JSON.stringify(value)).digest("hex");
}

export async function observePage(page, config) {
  const evaluation = await page.evaluate(({ textLimit, elementLimit }) => {
    const isVisible = (element) => {
      if (!element) return false;
      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return (
        style &&
        style.visibility !== "hidden" &&
        style.display !== "none" &&
        rect.width > 0 &&
        rect.height > 0
      );
    };

    const cleanText = (value) => String(value || "").replace(/\s+/g, " ").trim();
    let seed = 0;

    const ensureId = (element) => {
      if (!element.dataset.vgstId) {
        seed += 1;
        element.dataset.vgstId = `vgst-${seed}`;
      }
      return element.dataset.vgstId;
    };

    const toDescriptor = (element) => {
      const text = cleanText(
        element.innerText ||
          element.textContent ||
          element.getAttribute("aria-label") ||
          element.getAttribute("placeholder") ||
          element.value,
      );

      return {
        selector: `[data-vgst-id="${ensureId(element)}"]`,
        text,
        placeholder: cleanText(element.getAttribute("placeholder")),
        label: cleanText(element.getAttribute("aria-label")),
        value: cleanText(element.value),
        type: element.getAttribute("type") || element.tagName.toLowerCase(),
        tag: element.tagName.toLowerCase(),
        role: element.getAttribute("role") || "",
        disabled: Boolean(element.disabled || element.getAttribute("aria-disabled") === "true"),
      };
    };

    const interactiveSelector = [
      "button",
      "a[href]",
      "input",
      "textarea",
      "select",
      "[role='button']",
      "[role='link']",
      "[role='textbox']",
      "[contenteditable='true']",
      "[tabindex]:not([tabindex='-1'])",
    ].join(",");

    const interactive = Array.from(document.querySelectorAll(interactiveSelector))
      .filter(isVisible)
      .map(toDescriptor)
      .filter((item) => item.text || item.placeholder || item.label)
      .slice(0, elementLimit);

    const buttons = interactive.filter((item) => ["button", "submit", "reset"].includes(item.type) || item.role === "button");
    const inputs = interactive.filter((item) => ["input", "textarea", "select", "textbox", "text", "search", "email"].includes(item.type) || item.tag === "textarea");
    const links = interactive.filter((item) => item.tag === "a" || item.role === "link");

    const modals = Array.from(document.querySelectorAll("dialog, [role='dialog'], .modal, .dialog"))
      .filter(isVisible)
      .slice(0, 6)
      .map((element) => cleanText(element.innerText).slice(0, 240));

    const forms = Array.from(document.querySelectorAll("form"))
      .filter(isVisible)
      .slice(0, 6)
      .map((form, index) => ({
        id: form.getAttribute("id") || `form-${index + 1}`,
        text: cleanText(form.innerText).slice(0, 240),
      }));

    const visibleText = cleanText(document.body.innerText).slice(0, textLimit);

    return {
      url: window.location.href,
      title: document.title,
      visibleText,
      buttons,
      inputs,
      links,
      modals,
      forms,
      interactive,
    };
  }, {
    textLimit: config.observer?.textLimit || 2600,
    elementLimit: config.observer?.elementLimit || 36,
  });

  const hashPayload = {
    url: evaluation.url,
    title: evaluation.title,
    visibleText: evaluation.visibleText,
    buttons: evaluation.buttons,
    inputs: evaluation.inputs,
    links: evaluation.links,
    modals: evaluation.modals,
  };

  return {
    ...evaluation,
    hash: hashState(hashPayload),
  };
}
