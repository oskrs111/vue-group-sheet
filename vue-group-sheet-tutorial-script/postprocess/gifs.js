import ffmpegPath from "ffmpeg-static";
import { spawn } from "node:child_process";
import { join, relative } from "node:path";
import { writeText } from "../shared/fs-utils.js";

function toRelative(fromDir, filePath) {
  return relative(fromDir, filePath).replace(/\\/g, "/");
}

function normalizePathForConcat(filePath) {
  return filePath.replace(/\\/g, "/");
}

async function runFfmpeg(args) {
  await new Promise((resolve, reject) => {
    const child = spawn(ffmpegPath, args, { stdio: "inherit" });
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`ffmpeg terminó con código ${code}`));
      }
    });
    child.on("error", reject);
  });
}

export async function generateStepGifs(steps, config, logger) {
  for (const step of steps) {
    const concatPath = join(config.output.debugDir, `${step.id}.frames.txt`);
    const gifPath = join(config.output.gifsDir, `${step.id}.gif`);
    const frameList = [
      `file '${normalizePathForConcat(step.beforeScreenshotPath)}'`,
      `duration ${(config.capture.gifHoldBeforeMs || 0.9).toFixed(2)}`,
      `file '${normalizePathForConcat(step.afterScreenshotPath)}'`,
      `duration ${(config.capture.gifHoldAfterMs || 1.35).toFixed(2)}`,
      `file '${normalizePathForConcat(step.afterScreenshotPath)}'`,
    ].join("\n");

    await writeText(concatPath, frameList);

    await runFfmpeg([
      "-y",
      "-f",
      "concat",
      "-safe",
      "0",
      "-i",
      concatPath,
      "-vf",
      `fps=${config.capture.gifFps || 10},scale=${config.capture.screenshotWidth || 800}:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse`,
      gifPath,
    ]);

    step.gifPath = toRelative(config.output.rootDir, gifPath);
    logger.info("GIF generado", { step: step.id, gif: step.gifPath });
  }

  return steps;
}
