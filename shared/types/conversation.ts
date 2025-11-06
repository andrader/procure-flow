export interface Conversation {
  id: string;
  title: string;
  snippet: string;
  updatedAt: string;
}

export interface Conversations {
  recent: Conversation[];
  older: Conversation[];
}
