import fs from "fs";
import fsPromises from "fs/promises";
import streamPromises from "stream/promises";
import path from "path";
import yauzl from "yauzl-promise";

const typicalGameDir =
  "C:\\Program Files (x86)\\Steam\\steamapps\\common\\KingdomComeDeliverance2";
const gameDir = process.argv[2] ?? typicalGameDir;
console.log(`Will search for game data in "${gameDir}" ...`);

// check that the dir exists
await fsPromises.stat(gameDir);

const localizationFiles = await fsPromises.readdir(
  path.join(gameDir, "Localization"),
);

for (let dirEntry of localizationFiles) {
  if (!dirEntry.endsWith("_xml.pak")) continue;
  const lang = dirEntry.split("_xml.pak")[0];
  const sourceDir = path.join(gameDir, "Localization");
  const targetDir = path.join("resources", "Localization", lang);
  await fsPromises.mkdir(targetDir, { recursive: true });

  const pkg = await yauzl.open(path.join(sourceDir, dirEntry));
  for await (const pkgEntry of pkg) {
    if (pkgEntry.filename != "text_ui_menus.xml") continue;
    const readStream = await pkgEntry.openReadStream();
    const writeStream = fs.createWriteStream(path.join(targetDir, pkgEntry.filename));
    await streamPromises.pipeline(readStream, writeStream);
    break;
  }
}

const gameDataFile = path.join(gameDir, "Data", "IPL_GameData.pak");
const gameDataPkg = await yauzl.open(gameDataFile);
const targetDir = path.join("resources", "Config");
await fsPromises.mkdir(targetDir, {recursive: true});
for await (const pkgEntry of gameDataPkg) {
  if (pkgEntry.filename != "Libs/Config/keybindSuperactions.xml") continue;
  const readStream = await pkgEntry.openReadStream();
  const writeStream = fs.createWriteStream(path.join(targetDir, "keybindSuperactions.xml"));
  await streamPromises.pipeline(readStream, writeStream);
}

console.log("Successfully extracted all game data.");
