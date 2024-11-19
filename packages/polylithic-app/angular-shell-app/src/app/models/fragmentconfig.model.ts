export interface FragmentConfig {
  fragmentId: string;
  prePiercingClassNames: string[];
  routePatterns: string[];
  upstream: string;
  onSsrFetchError?: () => { response: Response };
}
