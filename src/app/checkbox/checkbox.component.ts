import { Component, effect, output, signal } from '@angular/core';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { remixCheckFill } from "@ng-icons/remixicon";

@Component({
  selector: 'checkbox',
  imports: [NgIconComponent],
  templateUrl: './checkbox.component.html',
  styles: ``,
  providers: [provideIcons({remixCheckFill})]
})
export class CheckboxComponent {
  readonly selected = signal(false);
  readonly selectedEvent = output<boolean>({alias: "selected"});

  constructor() {
    effect(() => this.selectedEvent.emit(this.selected()));
  }
}
