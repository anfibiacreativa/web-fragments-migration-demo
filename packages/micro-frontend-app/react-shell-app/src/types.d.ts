
export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
}

declare module "react/jsx-runtime" {
  namespace JSX {
    interface IntrinsicElements {
      "web-fragment": any
    }
  }
}  