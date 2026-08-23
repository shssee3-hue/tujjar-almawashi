import sharp from "sharp";
import path from "path";

const animalsDir = path.resolve("public/images/animals");
const heroDir = path.resolve("public/images/hero");

async function makeIcon(name) {
  await sharp(path.join(animalsDir, `${name}-raw.jpg`))
    .resize(900, 900, { fit: "cover", position: "attention" })
    .webp({ quality: 78 })
    .toFile(path.join(animalsDir, `${name}.webp`));
  console.log(`icon: ${name}.webp`);
}

async function makeHero(srcName, outName) {
  await sharp(path.join(heroDir, `${srcName}.jpg`))
    .resize(2400, 1350, { fit: "cover", position: "attention" })
    .webp({ quality: 72 })
    .toFile(path.join(heroDir, `${outName}.webp`));
  console.log(`hero: ${outName}.webp`);
}

const targets = process.argv.slice(2);

if (targets.includes("sheep")) await makeIcon("sheep");
if (targets.includes("goat")) await makeIcon("goat");
if (targets.includes("horse")) await makeIcon("horse");
if (targets.includes("camel")) await makeIcon("camel");
if (targets.includes("cow")) await makeIcon("cow");
if (targets.includes("chicken")) await makeIcon("chicken");
if (targets.includes("feed")) await makeIcon("feed");
if (targets.includes("equipment")) await makeIcon("equipment");
if (targets.includes("services")) await makeIcon("services");
if (targets.includes("transport")) await makeIcon("transport");
if (targets.includes("offers")) await makeIcon("offers");
if (targets.includes("hero")) await makeHero("hero-desert-camel", "hero-desert-camel");
