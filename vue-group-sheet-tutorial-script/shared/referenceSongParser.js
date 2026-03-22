const normalizeLineBreaks = (value) => value.replace(/\r\n/g, "\n");

export function parseReferenceSongText(rawText) {
  const source = normalizeLineBreaks(rawText || "");
  const lines = source.split("\n");
  const blocks = {
    sections: [],
    structure: [],
    lyrics: [],
  };

  let current = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }

    if (trimmed === "Sections:") {
      current = "sections";
      continue;
    }

    if (trimmed === "Structure:") {
      current = "structure";
      continue;
    }

    if (trimmed === "Lyrics:") {
      current = "lyrics";
      continue;
    }

    if (!current) {
      continue;
    }

    blocks[current].push(line);
  }

  const sections = blocks.sections.map((line, index) => {
    const [rawId = "", rawContent = ""] = line.split("=");
    const id = rawId.trim();
    const content = rawContent.trim();
    const turnsMatch = content.match(/x(\d+)$/);
    const turns = turnsMatch ? Number(turnsMatch[1]) : 1;
    const body = turnsMatch ? content.slice(0, -turnsMatch[0].length) : content;
    const compasses = body
      .split("|")
      .map((part) => part.trim())
      .filter(Boolean);

    return {
      index,
      id,
      content,
      turns,
      compasses,
      measureCount: compasses.length,
    };
  });

  const structure = blocks.structure
    .join(" ")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  const lyrics = blocks.lyrics.map((line, index) => {
    const [rawId = "", ...rest] = line.split("=");
    const id = rawId.trim();
    const text = rest.join("=").trim();
    return {
      index,
      id,
      text,
      preview: text.length > 120 ? `${text.slice(0, 117)}...` : text,
    };
  });

  return {
    rawText: source,
    sections,
    structure,
    lyrics,
    summary: {
      sectionCount: sections.length,
      structureCount: structure.length,
      lyricCount: lyrics.length,
      sectionIds: sections.map((section) => section.id),
    },
  };
}
