import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const src =
  "C:/Users/Adi/.cursor/projects/c-Users-Adi-Projects-BBNCS/assets/c__Users_Adi_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_bbncs-inside-46cc56cb-f3f4-43b3-8001-4837cfba1ddc.png";
const output = path.join(root, "public/images/gbp-interior-entrance.jpg");

const meta = await sharp(src).metadata();
const w = meta.width;
const h = meta.height;

// Tighter crop on door + banner; trim dark left wall and excess floor.
const crop = {
  left: Math.round(w * 0.06),
  top: Math.round(h * 0.02),
  width: Math.round(w * 0.92),
  height: Math.round(h * 0.88),
};

let buffer = await sharp(src)
  .extract(crop)
  .modulate({ brightness: 1.1, saturation: 1.05 })
  .gamma(1.05)
  .sharpen({ sigma: 0.8 })
  .toBuffer();

const cw = crop.width;
const ch = crop.height;

// Blur small paper notice on door (below main sign) if present.
const notice = {
  left: Math.round(cw * 0.08),
  top: Math.round(ch * 0.52),
  width: Math.round(cw * 0.18),
  height: Math.round(ch * 0.1),
};

const blurred = await sharp(buffer).extract(notice).blur(18).toBuffer();
buffer = await sharp(buffer)
  .composite([{ input: blurred, left: notice.left, top: notice.top }])
  .toBuffer();

await sharp(buffer).jpeg({ quality: 90, mozjpeg: true }).toFile(output);

const outMeta = await sharp(output).metadata();
console.log(`Saved ${output} (${outMeta.width}x${outMeta.height})`);
