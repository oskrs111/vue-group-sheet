import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

export async function ensureDir(dirPath) {
  await mkdir(dirPath, { recursive: true });
}

export async function ensureParentDir(filePath) {
  await ensureDir(dirname(filePath));
}

export async function writeJson(filePath, data) {
  await ensureParentDir(filePath);
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

export async function writeText(filePath, text) {
  await ensureParentDir(filePath);
  await writeFile(filePath, text, "utf8");
}

export async function readText(filePath) {
  return readFile(filePath, "utf8");
}

export async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
