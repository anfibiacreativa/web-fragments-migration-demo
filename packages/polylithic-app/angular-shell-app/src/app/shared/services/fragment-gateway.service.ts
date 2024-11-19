import { Injectable } from '@angular/core';
import { FragmentGateway } from 'web-fragments/gateway';
import { FragmentConfig } from '../../models/fragmentconfig.model';

export interface GatewayConfig {
  prePiercingStyles: string;
}

@Injectable({
  providedIn: 'root',
})
export class FragmentGatewayService {
  private gateway: FragmentGateway;

  constructor() {
    this.gateway = new FragmentGateway({
      prePiercingStyles: `
        <style id="fragment-piercing-styles" type="text/css">
          fragment-host[data-piercing="true"] {
            position: absolute;
            z-index: 9999999999999999999999999999999;
          }
        </style>
      `,
    });
  }

  initializeGateway(config: GatewayConfig): void {
    this.gateway = new FragmentGateway(config);
  }

  registerFragment(fragmentConfig: FragmentConfig): void {
    this.gateway.registerFragment(fragmentConfig);
  }
}
