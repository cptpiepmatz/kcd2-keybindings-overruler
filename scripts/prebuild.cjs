const fsPromises = require("fs/promises");
const path = require("path");
const { XMLParser } = require("fast-xml-parser");
const toml = require("smol-toml");

const TARGET_DIR = path.join(__dirname, "..", "public", "generated");
const RESOURCES_DIR = path.join(__dirname, "..", "resources");
const ASSETS_DIR = path.join(__dirname, "..", "src", "assets");
const CONFIG_DIR = path.join(RESOURCES_DIR, "Config");
const LOCALIZATION_DIR = path.join(RESOURCES_DIR, "Localization");

module.exports = {
  name: "prebuild-plugin",
  async setup() {
    // check that the resource files do exist
    await fsPromises.stat(CONFIG_DIR);
    await fsPromises.stat(LOCALIZATION_DIR);

    const langs = {};
    const translationKeys = [];
    
    const keyboardKeysFile = path.join(ASSETS_DIR, "browser-to-cryengine-keys.toml");
    const keyboardKeysContent = await fsPromises.readFile(keyboardKeysFile, "utf-8");
    const keyboardKeys = toml.parse(keyboardKeysContent);
    for (const key of Object.values(keyboardKeys.keys)) translationKeys.push("ui_key_" + key);

    const parser = new XMLParser({ignoreAttributes: false});
    
    const keybindSuperactionsFile = path.join(CONFIG_DIR, "keybindSuperactions.xml");
    const keybindSuperactionsXml = await fsPromises.readFile(keybindSuperactionsFile, "utf-8");
    const keybindSuperactions = parser.parse(keybindSuperactionsXml);
    const keybindSuperactionsExtract = {};
    for (const superaction of keybindSuperactions.keybinds.superaction) {
      const name = superaction["@_name"];
      const uiName = superaction["@_ui_name"];
      const uiGroup = superaction["@_ui_group"];
      if (!name || !uiGroup) continue;
      
      translationKeys.push(uiName);
      keybindSuperactionsExtract[name] = {
        uiName,
        controls: [superaction["control"]].flat().map(control => control["@_input"])
      }
    }
    const keybindSuperactionsJson = JSON.stringify(keybindSuperactionsExtract, null, 2);
    await fsPromises.writeFile(
      path.join(TARGET_DIR, "defaultKeybindings.json"), 
      keybindSuperactionsJson
    );

    const localizationDirs = await fsPromises.readdir(LOCALIZATION_DIR);
    for (const locale of localizationDirs) {
      const localeFile = path.join(LOCALIZATION_DIR, locale, "text_ui_menus.xml");
      const localeContent = await fsPromises.readFile(localeFile, "utf-8");
      const localeData = parser.parse(localeContent).Table.Row;
      
      const localeName = localeData.find(({Cell: row}) => {
        return row[0] == "ui_" + locale || row[0] == "ui_" + locale.toLowerCase()
      }).Cell[2];
      langs[locale.toLowerCase()] = localeName;

      const localeTranslations = {};
      for (const translationKey of translationKeys) {
        const asKey = translationKey.slice("ui_key_".length);
        if (asKey.length == 1) {
          localeTranslations[translationKey] = asKey.toUpperCase();
          continue;
        }

        localeTranslations[translationKey] = (() => {
          switch (asKey) {
            case "tilde": return "~";
            case "minus": return "-";
            case "equals": return "=";
            case "plus": return "+";
            case "lbracket": return "[";
            case "rbracket": return "]";
            case "backslash": return "\\";
            case "semicolon": return ";";
            case "apostrophe": return "'";
            case "comma": return ",";
            case "period": return ".";
            case "slash": return "/";
            default: return undefined;
          }
        })();

        if (localeTranslations[translationKey]) continue;

        const translated = localeData.find(({Cell: row}) => row[0] == translationKey);
        if (!translated) throw new Error(`Could not find translation "${translationKey}" for locale "${locale}"`);
        localeTranslations[translationKey] = translated.Cell[2];
      }

      const localeTranslationsJson = JSON.stringify(localeTranslations, null, 2);
      await fsPromises.writeFile(
        path.join(TARGET_DIR, locale.toLowerCase() + ".i18n.json"), 
        localeTranslationsJson
      );
    }

    const langsJson = JSON.stringify(langs, null, 2);
    await fsPromises.writeFile(
      path.join(ASSETS_DIR, "generated", "langs.json"), 
      langsJson
    );
  }
}
