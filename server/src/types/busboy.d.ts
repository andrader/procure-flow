declare module "busboy" {
  import type { IncomingHttpHeaders } from "http";
  import { Readable, Writable } from "stream";

  export interface FileInfo {
    filename: string;
    mimeType: string;
    encoding: string;
  }

  export interface FieldInfo {
    nameTruncated: boolean;
    valueTruncated: boolean;
    encoding: string;
    mimeType: string;
  }

  export interface BusboyOptions {
    headers: IncomingHttpHeaders;
    limits?: {
      fieldNameSize?: number;
      fieldSize?: number;
      fields?: number;
      fileSize?: number;
      files?: number;
      parts?: number;
      headerPairs?: number;
    };
  }

  export interface BusboyInstance extends Writable {
    on(event: "file", cb: (name: string, file: Readable, info: FileInfo) => void): this;
    on(event: "field", cb: (name: string, value: string, info: FieldInfo) => void): this;
    on(event: "finish", cb: () => void): this;
    on(event: "error", cb: (err: unknown) => void): this;
  }

  export default function Busboy(options: BusboyOptions): BusboyInstance;
}
