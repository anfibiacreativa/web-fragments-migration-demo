import { Component, CUSTOM_ELEMENTS_SCHEMA, Input, OnInit } from '@angular/core';
import { FragmentGatewayService } from '../../shared/services/fragment-gateway.service';

@Component({
  selector: 'app-fragment',
  standalone: true,
  template: `
    <div class="fragment-wrapper">
      <h2>{{ fragmentId }} Fragment</h2>
      <fragment-outlet [attr.fragment-id]="fragmentId" [attr.upstream-url]="upstreamUrl"></fragment-outlet>
    </div>
  `,
  styleUrl: './fragment.component.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class FragmentComponent implements OnInit {
  @Input() fragmentId: string = '';
  @Input() upstreamUrl: string = '';

  constructor(private fragmentGatewayService: FragmentGatewayService) {}

  ngOnInit(): void {
    if (this.fragmentId === '' || this.upstreamUrl === '') {
      console.error('Fragment needs a url and id configuration, to work');
      return;
    }

    this.fragmentGatewayService.initializeGateway({
      prePiercingStyles: `
        <style id="fragment-piercing-styles" type="text/css">
          fragment-host[data-piercing="true"] {
            position: absolute;
            z-index: 9999999999999999999999999999999;

            &.${this.fragmentId} {
              bottom: 16%;
              left: 15%;
            }
          }
        </style>
      `,
    });

    this.fragmentGatewayService.registerFragment({
      fragmentId: this.fragmentId,
      prePiercingClassNames: [this.fragmentId],
      routePatterns: ['/', `/${this.fragmentId}-page/`, `/_fragment/${this.fragmentId}/`],
      upstream: this.upstreamUrl,
      onSsrFetchError: () => {
        return {
          response: new Response(
            `<p id='${this.fragmentId}-fragment-not-found'>
              <style>
                #${this.fragmentId}-fragment-not-found { color: red; font-size: 2rem; }
              </style>
              ${this.fragmentId} fragment not found
            </p>`,
            { headers: [['content-type', 'text/html']] }
          ),
        };
      },
    });
  }
}
