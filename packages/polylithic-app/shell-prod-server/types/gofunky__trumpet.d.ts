declare module "@gofunky/trumpet" {
  import { Readable, Writable } from "stream";

  export default function trumpet(): Trumpet;

  export interface Trumpet {
    pipe(destination: Writable, options?: { end?: boolean }): Writable;
    select(selector: string, callback: (element: TrumpetElement) => void): void;
    createWriteStream(selector: string): Writable;
  }

  export interface TrumpetElement {
    createReadStream(): Readable;
    createWriteStream(): Writable;
    setAttribute(name: string, value: string): void;
    removeAttribute(name: string): void;
  }
}
