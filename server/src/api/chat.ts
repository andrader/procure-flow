import { NextApiRequest, NextApiResponse } from "next";
import { createChat, loadChat, saveChat } from "../lib/chat-store";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST" && req.query.create !== undefined) {
    // Create a new chat
    const id = await createChat();
    res.status(200).json({ id });
    return;
  }

  if (req.method === "GET" && typeof req.query.id === "string") {
    // Load chat messages
    const messages = await loadChat(req.query.id);
    res.status(200).json({ messages });
    return;
  }

  if (req.method === "POST" && typeof req.query.id === "string") {
    // Save chat messages
    const { messages } = req.body;
    await saveChat({ chatId: req.query.id, messages });
    res.status(200).json({ success: true });
    return;
  }

  res.status(404).json({ error: "Not found" });
}
