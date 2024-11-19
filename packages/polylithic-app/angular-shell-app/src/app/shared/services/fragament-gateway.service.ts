import { Injectable } from '@angular/core';
import { FragmentGateway } from 'web-fragments/gateway';
import { FragmentConfig } from '../../models/fragmentconfig.model';
import { register } from 'web-fragments/elements';

export interface GatewayConfig {
  prePiercingStyles: string;
}

@Injectable({
  providedIn: 'root',
})
export class FragmentGatewayService {
  private gateway: FragmentGateway;
  private isRegistered = false;

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

    if (this.isBrowser() && !this.isRegistered) {
      this.registerFragments();
    }
  }

  private isBrowser(): boolean {
    return typeof window !== 'undefined';
  }

  private registerFragments(): void {
    if (this.isBrowser() && !this.isRegistered) {
      register();
      this.isRegistered = true;
    }
  }

  initializeGateway(config: GatewayConfig): void {
    this.gateway = new FragmentGateway(config);
    this.registerFragments();
  }

  registerFragment(fragmentConfig: FragmentConfig): void {
    this.gateway.registerFragment(fragmentConfig);
  }
}
