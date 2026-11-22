export interface SourceReference {
  id: string;
  publisher: string;
  title: string;
  url: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  provider?: string;
  noticeKey?: string;
  sources?: SourceReference[];
}
