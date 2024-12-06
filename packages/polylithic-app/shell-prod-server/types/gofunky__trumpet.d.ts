declare module '@gofunky/trumpet' {
  import { Readable, Writable, Duplex } from 'stream';

  export default function trumpet(): Trumpet;

  export interface Trumpet extends Duplex {
    select(selector: string, callback?: (element: TrumpetElement) => void): TrumpetElement;
    selectAll(selector: string, callback: (element: TrumpetElement) => void): void;
    createWriteStream(selector: string): Writable;
  }

  export interface TrumpetElement {
    createReadStream(): Readable;
    createWriteStream(): Writable;
    createStream(): Duplex;
    getAttribute(name: string, callback: (value: string) => void): TrumpetElement;
    getAttributes(name: string, callback: (attributes: Record<string, string>) => void): TrumpetElement
    setAttribute(name: string, value: string): void;
    removeAttribute(name: string): void;
  }
}
