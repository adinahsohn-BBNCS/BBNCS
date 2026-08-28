import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const src =
  "C:/Users/Adi/.cursor/projects/c-Users-Adi-Projects-BBNCS/assets/c__Users_Adi_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_bbncs-inside2-91fb4a1b-3d99-4f65-a43e-754e8e86746b.png";
const output = path.join(root, "public/images/gbp-interior-office.jpg");

const meta = await sharp(src).metadata();
const w = meta.width;
const h = meta.height;

const crop = {
  left: Math.round(w * 0.14),
  top: Math.round(h * 0.04),
  width: Math.round(w * 0.84),
  height: Math.round(h * 0.9),
};

let buffer = await sharp(src).extract(crop).toBuffer();
const cw = crop.width;
const ch = crop.height;

const regions = [
  { left: Math.round(cw * 0.18), top: Math.round(ch * 0.08), width: Math.round(cw * 0.28), height: Math.round(ch * 0.32) },
  { left: Math.round(cw * 0.46), top: Math.round(ch * 0.08), width: Math.round(cw * 0.28), height: Math.round(ch * 0.32) },
  { left: Math.round(cw * 0.78), top: Math.round(ch * 0.34), width: Math.round(cw * 0.16), height: Math.round(ch * 0.12) },
];

for (const region of regions) {
  const blurred = await sharp(buffer).extract(region).blur(28).toBuffer();
  buffer = await sharp(buffer)
    .composite([{ input: blurred, left: region.left, top: region.top }])
    .toBuffer();
}

await sharp(buffer).jpeg({ quality: 90, mozjpeg: true }).toFile(output);

const outMeta = await sharp(output).metadata();
console.log(`Saved ${output} (${outMeta.width}x${outMeta.height})`);
