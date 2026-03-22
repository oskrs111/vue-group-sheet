const joinList = (items) => items.filter(Boolean).join(", ");

export function buildTutorialPhases(referenceSong) {
  return [
    {
      id: "open-script",
      title: "Abrir Script",
      order: 1,
      tutorialCopy: "Abre la herramienta Script desde la barra lateral para trabajar toda la canción en un único texto.",
    },
    {
      id: "sections",
      title: "Secciones",
      order: 2,
      tutorialCopy: `Empieza por Sections: y define las secciones ${joinList(referenceSong.sections.map((section) => section.id))}.`,
    },
    {
      id: "structure",
      title: "Estructura",
      order: 3,
      tutorialCopy: `Añade Structure: para ordenar la canción como ${referenceSong.structure.join(", ")}.`,
    },
    {
      id: "lyrics",
      title: "Letras",
      order: 4,
      tutorialCopy: "Completa Lyrics: para dejar las entradas listas dentro del mismo script.",
    },
    {
      id: "apply-script",
      title: "Aplicar",
      order: 5,
      tutorialCopy: "Pulsa Aplicar y deja que el editor construya la canción completa a partir del script.",
    },
  ];
}

export function buildTutorialGoal(referenceSong) {
  return [
    "Create a slide-based tutorial for Group Sheet Editor focused on the Script feature.",
    "Teach a person how to build the song Dark End Of Street by editing the script step by step.",
    "The learning order must be: open Script, Sections, Structure, Lyrics, Apply.",
  ].join(" ");
}

export function buildScriptVariants(referenceSong) {
  const sectionsBlock = `Sections:\n${referenceSong.sections.map((section) => `${section.id}=${section.content}`).join("\n")}`;
  const structureBlock = `Structure:\n${referenceSong.structure.join(",")}`;
  const lyricsBlock = `Lyrics:\n${referenceSong.lyrics.map((entry) => `${entry.id}=${entry.text}`).join("\n")}`;

  return {
    sectionsOnly: `${sectionsBlock}\n\nStructure:\n\nLyrics:\n`,
    sectionsAndStructure: `${sectionsBlock}\n\n${structureBlock}\n\nLyrics:\n`,
    complete: `${sectionsBlock}\n\n${structureBlock}\n\n${lyricsBlock}`,
    sectionsBlock,
    structureBlock,
    lyricsBlock,
  };
}

export function buildPresetFlow(referenceSong) {
  const script = buildScriptVariants(referenceSong);

  return [
    {
      id: "open-script-modal",
      phaseId: "open-script",
      title: "Abrir el editor de script",
      lessonText:
        "La vista Script reúne toda la canción en un único texto. Es la forma más rápida de crear o revisar una hoja completa sin editar compás por compás.",
      action: {
        action: "click",
        target: { role: "button", textIncludes: "Script" },
        description: "Abrir la función Script.",
      },
    },
    {
      id: "write-sections",
      phaseId: "sections",
      title: "Escribir el bloque Sections",
      lessonText:
        "Empieza por Sections:. Cada línea define una sección y sus compases. Aquí se cargan In, A, B y C, que serán la base del resto de la canción.",
      codeSnippet: script.sectionsBlock,
      action: {
        action: "type",
        target: { type: "textarea", placeholderIncludes: "Escribe tu script" },
        value: script.sectionsOnly,
        revealText: "Sections:",
        description: "Rellenar el bloque Sections con las secciones de la canción.",
      },
    },
    {
      id: "write-structure",
      phaseId: "structure",
      title: "Añadir Structure",
      lessonText:
        "Cuando las secciones ya están definidas, añade Structure: para fijar el orden real de interpretación. En este caso la canción sigue In, A, A, B y C.",
      codeSnippet: script.structureBlock,
      action: {
        action: "type",
        target: { type: "textarea", placeholderIncludes: "Escribe tu script" },
        value: script.sectionsAndStructure,
        revealText: "Structure:",
        description: "Completar la estructura de la canción dentro del script.",
      },
    },
    {
      id: "write-lyrics",
      phaseId: "lyrics",
      title: "Completar Lyrics",
      lessonText:
        "Por último se añade Lyrics:. Cada entrada se queda ligada a una aparición de la sección en la estructura, así que el script ya contiene acordes, orden y texto.",
      codeSnippet: script.lyricsBlock,
      action: {
        action: "type",
        target: { type: "textarea", placeholderIncludes: "Escribe tu script" },
        value: script.complete,
        revealText: "Lyrics:",
        description: "Completar las letras dentro del script.",
      },
    },
    {
      id: "apply-script",
      phaseId: "apply-script",
      title: "Aplicar el script",
      lessonText:
        "Pulsa Aplicar para convertir el texto en la canción editable. El editor crea de una vez las secciones, la estructura y las letras a partir del script final.",
      action: {
        action: "click",
        target: { role: "button", textIncludes: "Aplicar" },
        description: "Aplicar el script y construir la canción.",
      },
    },
  ];
}
