import { generateId, type UIMessage } from "ai";
import { existsSync, mkdirSync } from "fs";
import { writeFile, readFile } from "fs/promises";
import path from "path";

/**
 * Create a new chat and persist an empty message array.
 * Returns the generated chat id.
 */
export async function createChat(): Promise<string> {
  const id = generateId();
  await writeFile(getChatFile(id), "[]");
  return id;
}

/**
 * Load all messages for a chat id.
 */
export async function loadChat(id: string): Promise<UIMessage[]> {
  return JSON.parse(await readFile(getChatFile(id), "utf8")) as UIMessage[];
}

/**
 * Persist all messages for a chat id.
 */
export async function saveChat({ chatId, messages }: { chatId: string; messages: UIMessage[] }): Promise<void> {
  const content = JSON.stringify(messages, null, 2);
  await writeFile(getChatFile(chatId), content);
}

function getChatFile(id: string): string {
  const chatDir = path.join(process.cwd(), ".chats");
  if (!existsSync(chatDir)) mkdirSync(chatDir, { recursive: true });
  return path.join(chatDir, `${id}.json`);
}
