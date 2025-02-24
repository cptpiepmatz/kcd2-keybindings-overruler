import { HttpClient } from '@angular/common/http';
import { Injectable, Signal, signal } from '@angular/core';
import { toSignal } from "@angular/core/rxjs-interop";
import langs from "../assets/generated/langs.json";

@Injectable({
  providedIn: 'root'
})
export class ResourceService {
  readonly langs: Record<string, {
    localizedName: string, 
    translations: Signal<Record<string, string> | undefined>
  }> = {};

  readonly defaultKeybindings: Signal<Record<string, {
    uiName: string,
    controls: string[],
  }> | undefined>;

  constructor(private http: HttpClient) {
    for (const [lang, localizedName] of Object.entries(langs)) {
      const translations = toSignal(http.get<Record<string, string>>(
        `./generated/${lang}.i18n.json`
      ));

      this.langs[lang] = {
        localizedName,
        translations
      }
    }

    this.defaultKeybindings = toSignal(this.http.get<Record<string, {
      uiName: string,
      controls: string[],
    }>>(
      "./generated/defaultKeybindings.json"
    ));
  }
}
