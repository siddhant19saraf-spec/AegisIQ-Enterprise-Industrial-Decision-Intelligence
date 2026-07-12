import { api } from "@/lib/api/client";

export interface Citation {
  source: string;
  title: string;
  snippet: string;
  relevance: number;
}

export interface ThinkingStep {
  phase: string;
  detail: string;
}

export interface CopilotResponse {
  conversation_id: string;
  response: string;
  citations: Citation[];
  thinking: ThinkingStep[];
  confidence: number;
  suggested_prompts: string[];
}

export interface Conversation {
  id: string;
  title: string;
  messages: { role: string; content: string }[];
  created_at: string;
  updated_at: string;
}

export const copilotApi = {
  chat: async (message: string, conversation_id?: string): Promise<CopilotResponse> => {
    return api.post("/copilot/chat", { message, conversation_id });
  },

  chatStream: () => {
    throw new Error("Use chatStreamFetch instead");
  },

  chatStreamFetch: async (
    message: string,
    onToken: (token: string) => void,
    onThinking: (phase: string, detail: string) => void,
    onCitations: (citations: Citation[]) => void,
    onDone: (data: { conversation_id: string; confidence: number; suggested_prompts: string[] }) => void,
    conversation_id?: string,
  ): Promise<void> => {
    const response = await fetch(`${api.getBaseUrl()}/copilot/chat/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, conversation_id }),
    });

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No reader available");

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("event: ")) {
          continue;
        }
        if (line.startsWith("data: ")) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.token !== undefined) onToken(data.token);
            if (data.phase) onThinking(data.phase, data.detail);
            if (data.citations) onCitations(data.citations);
            if (data.conversation_id) onDone(data);
          } catch {
            // ignore parse errors
          }
        }
      }
    }
  },

  submitFeedback: async (conversation_id: string, message_index: number, feedback: "up" | "down") => {
    return api.post("/copilot/feedback", { conversation_id, message_index, feedback });
  },

  getConversations: async (): Promise<Conversation[]> => {
    return api.get("/copilot/conversations");
  },

  getConversation: async (id: string): Promise<Conversation> => {
    return api.get(`/copilot/conversations/${encodeURIComponent(id)}`);
  },

  getSuggestions: async (): Promise<string[]> => {
    return api.get("/copilot/suggestions");
  },
};
