import { Component, computed, effect, ElementRef, inject, Signal, signal, viewChild, WritableSignal } from '@angular/core';
import { ResourceService } from './resource.service';
import { provideIcons, NgIconComponent } from "@ng-icons/core";
import { remixGithubFill, remixArrowDownSLine, remixArrowUpSLine, remixTranslate2 } from "@ng-icons/remixicon";
import { repository } from "../../package.json";
import { CheckboxComponent } from './checkbox/checkbox.component';
import { DOCUMENT, KeyValuePipe } from '@angular/common';
import { fromEvent } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import keyMapping from "../assets/browser-to-cryengine-keys.toml";

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
  styles: `
    tr > * {
      vertical-align: middle;
    }

    input {
      caret-color: transparent;
    }
  `,
  providers: [
    provideIcons({
      remixGithubFill, 
      remixArrowDownSLine,
      remixArrowUpSLine, 
      remixTranslate2
    })
  ]
})
export class AppComponent {
  protected selectedLang = signal("english");
  protected lang = computed(() => this.resources.langs[this.selectedLang()]);

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

  constructor(protected resources: ResourceService) {
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
  
}
