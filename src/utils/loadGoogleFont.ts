import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";

const LOCAL_FONT_CANDIDATES = [
  // Satori does not support TTC collections; use TTF/OTF fonts only.
  "/usr/share/fonts/truetype/droid/DroidSansFallbackFull.ttf",
  "/usr/share/fonts/opentype/unifont/unifont.otf",
  "/usr/share/fonts/opentype/urw-base35/NimbusSans-Regular.otf",
];

const LOCAL_BOLD_FONT_CANDIDATES = [
  "/usr/share/fonts/truetype/droid/DroidSansFallbackFull.ttf",
  "/usr/share/fonts/opentype/unifont/unifont.otf",
  "/usr/share/fonts/opentype/urw-base35/NimbusSans-Bold.otf",
];

async function readFirstExistingFont(paths: string[]): Promise<ArrayBuffer> {
  const path = paths.find(existsSync);

  if (!path) {
    throw new Error(`No local font found. Checked: ${paths.join(", ")}`);
  }

  const buffer = await readFile(path);
  return new Uint8Array(buffer).slice().buffer;
}

async function loadLocalFonts(): Promise<
  Array<{ name: string; data: ArrayBuffer; weight: number; style: string }>
> {
  const [regular, bold] = await Promise.all([
    readFirstExistingFont(LOCAL_FONT_CANDIDATES),
    readFirstExistingFont(LOCAL_BOLD_FONT_CANDIDATES),
  ]);

  return [
    { name: "Noto Sans CJK", data: regular, weight: 400, style: "normal" },
    { name: "Noto Sans CJK", data: bold, weight: 700, style: "normal" },
  ];
}

export default loadLocalFonts;
