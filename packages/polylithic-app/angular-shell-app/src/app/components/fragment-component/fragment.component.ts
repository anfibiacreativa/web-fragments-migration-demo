import { Component, CUSTOM_ELEMENTS_SCHEMA, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-fragment',
  standalone: true,
  template: `
    <div class="fragment-container pierced">
      <h2>{{ fragmentId }} Fragment</h2>
      <fragment-outlet [attr.fragment-id]="fragmentId"></fragment-outlet>
<!--       @if (showHost) {
        <fragment-host></fragment-host>
      } -->
    </div>
  `,
  styleUrl: './fragment.component.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class FragmentComponent implements OnInit {
  @Input() fragmentId: string = '';
  @Input() upstreamUrl: string = '';
  showHost = false;

  constructor() {}


  ngOnInit(): void {
    if (this.fragmentId === '' || this.upstreamUrl === '') {
      console.error('Fragment needs a url and id configuration, to work');
      return;
    }
  }
}
