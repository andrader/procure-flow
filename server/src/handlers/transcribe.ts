import type { Request, Response } from "express";
import Busboy, { type FileInfo, type FieldInfo } from "busboy";
import { experimental_transcribe as transcribe } from "ai";
import { openai } from "@ai-sdk/openai";

type ParsedUpload = {
  buffer: Buffer;
  filename: string | undefined;
  mimeType: string | undefined;
  fields: Record<string, string>;
};

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

function parseMultipart(req: Request): Promise<ParsedUpload> {
  return new Promise((resolve, reject) => {
    try {
  const busboy = Busboy({ headers: req.headers, limits: { fileSize: MAX_FILE_SIZE, files: 1 } });
      const chunks: Buffer[] = [];
      const fields: Record<string, string> = {};
      let filename: string | undefined;
      let mimeType: string | undefined;
      let fileReceived = false;

      busboy.on("file", (_name: string, file: NodeJS.ReadableStream, info: FileInfo) => {
        filename = info.filename;
        mimeType = info.mimeType;
        fileReceived = true;

        file.on("data", (data: Buffer) => {
          chunks.push(data);
        });

        file.on("limit", () => {
          reject(Object.assign(new Error("file_too_large"), { code: "file_too_large" }));
        });
      });

      busboy.on("field", (name: string, value: string, _info: FieldInfo) => {
        fields[name] = value;
      });

      busboy.on("error", (err: unknown) => reject(err));

      busboy.on("finish", () => {
        if (!fileReceived) {
          return reject(Object.assign(new Error("no_file"), { code: "no_file" }));
        }
        const buffer = Buffer.concat(chunks);
        resolve({ buffer, filename, mimeType, fields });
      });

      req.pipe(busboy);
    } catch (err) {
      reject(err);
    }
  });
}

export async function transcribeHandler(req: Request, res: Response) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "Server not configured: missing OPENAI_API_KEY" });
    }

    const { buffer, filename, mimeType, fields } = await parseMultipart(req);

    // Basic MIME allowlist
    if (mimeType && !/^audio\//.test(mimeType)) {
      return res.status(400).json({ error: "unsupported_mime", message: `Unsupported MIME type: ${mimeType}` });
    }

    const language = fields.language || undefined;
    const timestampGranularities = fields.timestampGranularities
      ? fields.timestampGranularities.split(",").map((s) => s.trim()).filter(Boolean)
      : undefined;

    const options: any = {
      model: openai.transcription("whisper-1"),
      audio: buffer,
    };
    if (language) options.language = language;
    if (timestampGranularities) options.providerOptions = { openai: { timestampGranularities } };

    const result = await transcribe(options);

    const { text, segments, language: lang, durationInSeconds, warnings } = result as any;
    return res.json({ text, segments, language: lang, durationInSeconds, warnings });
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.error("/api/transcribe error:", err);
    if (err?.code === "file_too_large") {
      return res.status(400).json({ error: "file_too_large", message: "Audio exceeds 20MB limit" });
    }
    if (err?.code === "no_file") {
      return res.status(400).json({ error: "no_file", message: "No audio file provided" });
    }
    return res.status(500).json({ error: "transcription_failed" });
  }
}
