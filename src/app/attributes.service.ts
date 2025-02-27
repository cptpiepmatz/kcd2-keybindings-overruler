import { Injectable, signal, Signal } from '@angular/core';
import { XMLParser, XMLBuilder } from "fast-xml-parser";

export type AttributeKeybindings = Record<string, [] | [string] | [string, string]>;
export type AttributesXML = {
  "?xml": {
    "@_version": string,
    "@_encoding": string,
  },
  Attributes: {
    "@_Version": "31",
    Attr: {
      "@_name": string,
      "@_value": string,
    }[],
  },
}

@Injectable({
  providedIn: 'root'
})
export class AttributesService {
  private parser = new XMLParser({ignoreAttributes: false});

  private builder = new XMLBuilder({
    ignoreAttributes: false,
    suppressEmptyNode: true,
    suppressBooleanAttributes: false,
    format: true,
  });

  importXml(xml: string): [AttributesXML, string | undefined] {
    const parsed = this.parser.parse(xml) as AttributesXML;

    if (parsed.Attributes['@_Version'] != "31") {
      throw new Error("mismatched attributes version");
    }

    const keybindsSettings = parsed.Attributes.Attr.find(
      attribute => attribute['@_name'] == "keybinds_settings"
    )?.['@_value'];

    return [parsed, keybindsSettings];
  }

  exportXml(parsedXml: AttributesXML, keybindsSettings: string): string {
    const xml = structuredClone(parsedXml);
    xml.Attributes.Attr.map(attr => {
      if (attr['@_name'] == "keybinds_settings") attr["@_value"] = keybindsSettings;
      return attr;
    })

    return this.builder.build(xml);
  }

  parseKeybindings(input: string): AttributeKeybindings {
    const keybindings: AttributeKeybindings = {}

    const parsed = this.parser.parse(input);
    for (const superaction of parsed.keybinds.superaction) {
      const key = superaction["@_name"];
      const controls = [superaction.control].flat().map(
        control => control["@_input"]
      ) as AttributeKeybindings[any];

      keybindings[key] = controls;
    }

    return keybindings;
  }

  stringifyKeybindings(input: AttributeKeybindings): string {
    const superaction = Object.entries(input).map(([key, controls]) => {
      const control = controls.map((
        control: string,
        index: number
      ) => ({"@_input": control, "@_slot": "" + index}));
      return {"@_controller": "keyboard", "@_name": key, control};
    });
    
    const toBuild = {
      keybinds: {
        superaction
      }
    }

    return this.builder.build(toBuild).replaceAll("\n", "&#10;");
  }
}
