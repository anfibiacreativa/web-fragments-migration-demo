declare module '@gofunky/trumpet' {
  import { Readable, Writable, Duplex } from 'stream';

  export default function trumpet(): Trumpet;

  export interface Trumpet {
    pipe(destination: Writable, options?: { end?: boolean }): Writable;
    select(selector: string, callback: (element: TrumpetElement) => void): void;
    selectAll(selector: string, callback: (element: TrumpetElement) => void): void;
    createWriteStream(selector: string): Writable;
  }

  export interface TrumpetElement extends Duplex {
    createReadStream(): Readable;
    createWriteStream(): Writable;
    getAttribute(name: string, callback: (value: string) => void): TrumpetElement;
    getAttributes(name: string, callback: (attributes: Record<string, string>) => void): TrumpetElement
    setAttribute(name: string, value: string): void;
    removeAttribute(name: string): void;
  }
}
