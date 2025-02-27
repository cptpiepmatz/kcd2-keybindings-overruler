import { Component, computed, effect, ElementRef, inject, model, Signal, signal, viewChild, WritableSignal } from '@angular/core';
import { ResourceService } from './resource.service';
import { provideIcons, NgIconComponent } from "@ng-icons/core";
import { remixGithubFill, remixArrowDownSLine, remixArrowUpSLine, remixTranslate2, remixClipboardLine, remixResetLeftLine, remixSteamFill, remixDownloadLine } from "@ng-icons/remixicon";
import { repository } from "../../package.json";
import { CheckboxComponent } from './checkbox/checkbox.component';
import { DOCUMENT, KeyValuePipe } from '@angular/common';
import { fromEvent } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import keyMapping from "../assets/browser-to-cryengine-keys.toml";
import { AttributeKeybindings, AttributesService, AttributesXML } from './attributes.service';
import packageJSON from "../../package.json";

interface Keybinding {
  uiName: string,
  included: WritableSignal<boolean>,
  slot0: WritableSignal<string | null>,
  slot1: WritableSignal<string | null>,
}

@Component({
  selector: 'app-root',
  imports: [NgIconComponent, CheckboxComponent, KeyValuePipe],
  templateUrl: './app.component.html',
  styleUrl: "./app.component.scss",
  providers: [
    provideIcons({
      remixArrowDownSLine,
      remixArrowUpSLine, 
      remixClipboardLine,
      remixGithubFill, 
      remixTranslate2,
      remixResetLeftLine,
      remixSteamFill,
      remixDownloadLine,
    })
  ]
})
export class AppComponent {
  protected copyPathText = viewChild.required<ElementRef<HTMLElement>>("copyPathText");
  protected fileSelect = viewChild.required<ElementRef<HTMLInputElement>>("filePicker");
  protected settingsFile = signal<File | undefined>(undefined);
  protected settingsXML = signal<AttributesXML | undefined>(undefined);
  protected settingsAttribute = model<string>("");
  protected copyExportSpan = viewChild.required<ElementRef<HTMLSpanElement>>("copyExportSpan");
  protected exportAnchor = viewChild.required<ElementRef<HTMLAnchorElement>>("exportAnchor");

  protected selectedLang = signal("english");
  protected lang = computed(() => this.resources.langs[this.selectedLang()]);
  protected package = packageJSON;

  protected keybindings: Record<string, Keybinding> = {};
  protected keybindingsIter = signal<Iterable<[string, Keybinding]>>([]);

  protected repository = repository.url;
  protected langSelectDropdown = signal(false);

  protected modalInput: Signal<ElementRef<HTMLInputElement>> = viewChild.required("input");
  protected modalIsActive = signal(false);
  protected modalKeybinding = signal("");
  protected modalKeybindingName = computed(() => this.computeModalKeybindingName());
  protected modalSlot = signal<0 | 1>(0);
  protected modalValue = signal("");

  constructor(protected resources: ResourceService, protected attributes: AttributesService) {

    effect(async () => {
      let file = this.settingsFile();
      if (!file) {
        this.settingsXML.set(undefined);
        return;
      }

      let xml = await file.text();
      const [imported, importedKeybindsSettings] = attributes.importXml(xml);
      this.settingsXML.set(imported);
      this.settingsAttribute.set(importedKeybindsSettings ?? "");
    });

    effect(() => {
      let defaultKeybindings = this.resources.defaultKeybindings();
      if (!defaultKeybindings) return;
      for (let [key, {uiName, controls}] of Object.entries(defaultKeybindings)) {
        this.keybindings[key] = {
          uiName, 
          included: signal(false),
          slot0: signal(controls[0] ?? null),
          slot1: signal(controls[1] ?? null),
        };
      }

      this.keybindingsIter.set(Object.entries(this.keybindings));
    });

    effect(() => {
      if (this.modalIsActive()) {
        setTimeout(() => this.modalInput().nativeElement.focus());
      }
    });

    effect(() => {
      let attribute = this.settingsAttribute();
      if (!attribute) return;

      let parsedKeybindings = this.attributes.parseKeybindings(attribute);
      for (let [key, controls] of Object.entries(parsedKeybindings)) {
        let keybinding = this.keybindings[key];
        keybinding.included.set(true);
        keybinding.slot0.set(controls[0] ?? null);
        keybinding.slot1.set(controls[1] ?? null);
      }
    });
  }

  protected computeModalKeybindingName(): string | undefined {
    let translations = this.lang().translations();
    if (!translations) return undefined;

    let keybinding = this.keybindings[this.modalKeybinding()];
    if (!keybinding) return undefined;

    return translations[keybinding.uiName];
  }

  protected log(...input: any[]) {
    console.log(...input);
  }

  private updateModalKeybinding(value: string | null) {
    this.modalIsActive.set(false);
    const keybinding = this.keybindings[this.modalKeybinding()];
    if (this.modalSlot() == 0) keybinding.slot0.set(value);
    if (this.modalSlot() == 1) keybinding.slot1.set(value);
    keybinding.included.set(true);
  }
  
  protected onModalKeyboardEvent(event: KeyboardEvent) {
    event.preventDefault();
    if (event.type !== "keydown") return;
    const key = keyMapping.keys[event.code];
    this.updateModalKeybinding(key);
  }
  
  protected onModalUnset() {
    this.updateModalKeybinding(null);
  }
  
  protected onModalReset() {
    const defaultKeybinding = this.resources.defaultKeybindings()![this.modalKeybinding()];
    const defaultControl = defaultKeybinding.controls[this.modalSlot()] ?? null;
    this.updateModalKeybinding(defaultControl);
  }

  protected onModalMouseEvent(event: MouseEvent) {
    event.preventDefault();
    if (event.type !== "mousedown") return;
    const key = keyMapping.keys["Mouse" + event.button];
    this.updateModalKeybinding(key);
  }

  protected onModalWheelEvent(event: WheelEvent) {
    event.preventDefault();

    if (event.deltaY > 0) {
      const key = keyMapping.keys["MouseWheelDown"];
      this.updateModalKeybinding(key);
    } else {
      const key = keyMapping.keys["MouseWheelUp"];
      this.updateModalKeybinding(key);
    }
  }

  protected copyFilePath() {
    navigator.clipboard.writeText("%USERPROFILE%\\Saved Games\\kingdomcome2\\profiles\\default");
    this.copyPathText().nativeElement.innerText = "Copied!";
  }

  protected onFileSelectorChangeEvent() {
    let select = this.fileSelect();
    let [file] = select.nativeElement.files!;
    select.nativeElement.value = "";
    this.settingsFile.set(file);
  }

  private buildAttributeValue(): string {
    let toBuild: AttributeKeybindings = {};
    for (let [key, controls] of Object.entries(this.keybindings)) {
      if (!controls.included()) continue;
      let slot0 = controls.slot0();
      let slot1 = controls.slot1();
      let control = [slot0, slot1].filter(slot => !!slot);
      toBuild[key] = control as [] | [string] | [string, string];
    }

    return this.attributes.stringifyKeybindings(toBuild);
  }

  protected onExportValue() {
    let value = this.buildAttributeValue();

    let span = this.copyExportSpan();
    navigator.clipboard.writeText(value)
      .then(() => span.nativeElement.innerText = "Copied!")
      .then(() => setTimeout(
        () => span.nativeElement.innerText = "Copy to Clipboard", 
        2000
      ));
  }

  protected onExportFile() {
    let value = this.buildAttributeValue();
    let parsedXml = this.settingsXML();
    if (!parsedXml) throw new Error("no parsed xml stored");
    let content = this.attributes.exportXml(parsedXml, value);
    let blob = new Blob([content], {type: "text/xml"});
    let url = URL.createObjectURL(blob);
    let anchor = this.exportAnchor();
    anchor.nativeElement.href = url;
    anchor.nativeElement.click();
  }
  
}
