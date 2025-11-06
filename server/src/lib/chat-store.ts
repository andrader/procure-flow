import { generateId } from "ai";
import { existsSync, mkdirSync } from "fs";
import { writeFile, readFile } from "fs/promises";
import path from "path";

export async function createChat(): Promise<string> {
  const id = generateId();
  await writeFile(getChatFile(id), "[]");
  return id;
}

export async function loadChat(id: string) {
  return JSON.parse(await readFile(getChatFile(id), "utf8"));
}

export async function saveChat({ chatId, messages }: { chatId: string; messages: any[] }) {
  const content = JSON.stringify(messages, null, 2);
  await writeFile(getChatFile(chatId), content);
}

function getChatFile(id: string): string {
  const chatDir = path.join(process.cwd(), ".chats");
  if (!existsSync(chatDir)) mkdirSync(chatDir, { recursive: true });
  return path.join(chatDir, `${id}.json`);
}
