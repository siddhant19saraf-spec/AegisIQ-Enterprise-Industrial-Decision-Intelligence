import { useMutation, useQuery } from "@tanstack/react-query";
import { copilotApi } from "../api/copilot";
import type { CopilotResponse, Citation } from "../api/copilot";
import { useState, useRef, useCallback } from "react";

export function useCopilotChat() {
  const [response, setResponse] = useState<CopilotResponse | null>(null);
  const [streamingContent, setStreamingContent] = useState("");
  const [thinking, setThinking] = useState<{ phase: string; detail: string }[]>([]);
  const [citations, setCitations] = useState<Citation[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const convIdRef = useRef<string | undefined>(undefined);

  const chat = useMutation({
    mutationFn: async (message: string) => {
      return copilotApi.chat(message, convIdRef.current);
    },
    onSuccess: (data) => {
      setResponse(data);
      convIdRef.current = data.conversation_id;
    },
  });

  const streamChat = useCallback(async (message: string) => {
    setIsStreaming(true);
    setStreamingContent("");
    setThinking([]);
    setCitations([]);

    await copilotApi.chatStreamFetch(
      message,
      (token) => setStreamingContent((prev) => prev + token),
      (phase, detail) => setThinking((prev) => [...prev, { phase, detail }]),
      (cits) => setCitations(cits),
      (data) => {
        convIdRef.current = data.conversation_id;
        setResponse((prev) =>
          prev
            ? { ...prev, conversation_id: data.conversation_id, confidence: data.confidence, suggested_prompts: data.suggested_prompts }
            : {
                conversation_id: data.conversation_id,
                response: "",
                citations: [],
                thinking: [],
                confidence: data.confidence,
                suggested_prompts: data.suggested_prompts,
              },
        );
        setIsStreaming(false);
      },
      convIdRef.current,
    );
  }, []);

  return {
    response,
    streamingContent,
    thinking,
    citations,
    isStreaming,
    chat,
    streamChat,
    conversationId: convIdRef.current,
  };
}

export function useConversations() {
  return useQuery({
    queryKey: ["copilot-conversations"],
    queryFn: copilotApi.getConversations,
  });
}

export function useConversation(id: string) {
  return useQuery({
    queryKey: ["copilot-conversation", id],
    queryFn: () => copilotApi.getConversation(id),
  });
}
