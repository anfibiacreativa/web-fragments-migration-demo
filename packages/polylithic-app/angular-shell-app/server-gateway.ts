export interface FragmentConfig {
  fragmentId: string;
  prePiercingClassNames: string[];
  routePatterns: string[];
  upstream: string;
  onSsrFetchError: () => { response: Response };
}

export class ServerFragmentGateway {
  private prePiercingStyles: string | null = null;
  private fragments: Map<string, FragmentConfig> = new Map();

  constructor() {}

  initialize(config: { prePiercingStyles: string }): void {
    this.prePiercingStyles = config.prePiercingStyles;
  }

  registerFragment(config: FragmentConfig): void {
    if (!config.fragmentId) {
      throw new Error('Fragment ID is required.');
    }
    this.fragments.set(config.fragmentId, config);
  }

  getFragment(fragmentId: string): FragmentConfig | undefined {
    return this.fragments.get(fragmentId);
  }

  getAllFragments(): Map<string, FragmentConfig> {
    return this.fragments;
  }

  getPrePiercingStyles(): string | null {
    return this.prePiercingStyles;
  }
}
