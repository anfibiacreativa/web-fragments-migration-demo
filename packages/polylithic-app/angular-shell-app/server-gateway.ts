import { FragmentGateway } from 'web-fragments/gateway';
import { FragmentConfig } from './src/app/models/fragmentconfig.model';

export class ServerFragmentGateway {
  private static gateway: FragmentGateway | null = null;

  static initialize(config: { prePiercingStyles: string }): void {
    if (!ServerFragmentGateway.gateway) {
      ServerFragmentGateway.gateway = new FragmentGateway(config);
    }
  }

  static registerFragment(fragmentConfig: FragmentConfig): void {
    if (!ServerFragmentGateway.gateway) {
      throw new Error('FragmentGateway is not initialized.');
    }
    ServerFragmentGateway.gateway.registerFragment(fragmentConfig);
  }
}
