// One-off icon rasterizer — run with `node scripts/generate-icons.mjs`
// whenever public/favicon.svg or icon-maskable-master.svg change. Not part
// of the build; output PNGs are committed to public/ like any other asset.
import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const publicDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');
const mainSvg = readFileSync(join(publicDir, 'favicon.svg'));
const maskableSvg = readFileSync(join(publicDir, 'icon-maskable-master.svg'));

async function render(svg, size, outPath, background) {
  await sharp(svg, { density: 384 })
    .resize(size, size)
    .flatten(background ? { background } : undefined)
    .png()
    .toFile(join(publicDir, outPath));
  console.log('wrote', outPath);
}

await render(mainSvg, 192, 'icon-192.png');
await render(mainSvg, 512, 'icon-512.png');
await render(mainSvg, 180, 'apple-touch-icon.png', '#0e6b57');
await render(maskableSvg, 512, 'icon-maskable.png');
