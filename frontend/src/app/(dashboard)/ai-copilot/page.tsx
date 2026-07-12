"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Send, Bot, User, ThumbsUp, ThumbsDown, Loader2, Lightbulb, Brain,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCopilotChat } from "@/features/copilot/hooks/useCopilot";
import type { Citation } from "@/features/copilot/api/copilot";
import { cn } from "@/lib/utils";

const DEFAULT_SUGGESTIONS = [
  "What is the current status of all assets?",
  "Show me critical incidents that need attention",
  "What maintenance is overdue?",
  "Analyze the risk of asset failures",
  "What SOP documents cover emergency shutdown?",
];

const PHASE_LABELS: Record<string, string> = {
  analyze: "Analyzing query...",
  retrieve: "Searching enterprise knowledge...",
  query: "Querying operational data...",
  reason: "Generating response...",
  complete: "Finalizing...",
};

function ConfidenceIndicator({ confidence }: { confidence: number }) {
  const color = confidence >= 0.8 ? "bg-emerald-500" : confidence >= 0.6 ? "bg-amber-500" : "bg-red-500";
  const label = confidence >= 0.8 ? "High" : confidence >= 0.6 ? "Medium" : "Low";
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span>Confidence</span>
      <div className="h-1.5 w-16 rounded-full bg-muted">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${confidence * 100}%` }} />
      </div>
      <span className={cn("font-medium", confidence >= 0.8 ? "text-emerald-500" : confidence >= 0.6 ? "text-amber-500" : "text-red-500")}>
        {label}
      </span>
    </div>
  );
}

function CitationCard({ citation }: { citation: Citation }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-2.5 text-xs">
      <div className="flex items-center gap-1.5 font-medium text-foreground">
        <FileText className="h-3 w-3" />
        {citation.title}
      </div>
      <p className="mt-1 text-muted-foreground line-clamp-2">{citation.snippet}</p>
      <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground/60">
        <span>Source: {citation.source}</span>
        <span>·</span>
        <span>Relevance: {Math.round(citation.relevance * 100)}%</span>
      </div>
    </div>
  );
}

function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none break-words">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </div>
  );
}

export default function CopilotPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [feedbackGiven, setFeedbackGiven] = useState<Record<number, "up" | "down">>({});
  const [showCitations, setShowCitations] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { response, streamingContent, thinking, citations, isStreaming, streamChat } = useCopilotChat();

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    await streamChat(userMsg);
  };

  useEffect(() => {
    if (streamingContent) {
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return [...prev.slice(0, -1), { role: "assistant", content: streamingContent }];
        }
        return [...prev, { role: "assistant", content: streamingContent }];
      });
    }
  }, [streamingContent]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const renderThinkingIndicator = () => {
    if (!isStreaming || thinking.length === 0) return null;
    const current = thinking[thinking.length - 1];
    return (
      <div className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        <span>{PHASE_LABELS[current.phase] || current.detail}</span>
      </div>
    );
  };

  const renderCitations = () => {
    if (!citations || citations.length === 0) return null;
    return (
      <div className="space-y-2 px-4 pb-4">
        <button
          onClick={() => setShowCitations(!showCitations)}
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <FileText className="h-3.5 w-3.5" />
          {citations.length} source{citations.length > 1 ? "s" : ""} cited
          <span className="ml-1">{showCitations ? "▲" : "▼"}</span>
        </button>
        {showCitations && (
          <div className="grid gap-2 sm:grid-cols-2">
            {citations.map((c, i) => (
              <CitationCard key={i} citation={c} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      <div className="flex items-center justify-between border-b px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-primary/10 p-2">
            <Brain className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">AI Copilot</h1>
            <p className="text-xs text-muted-foreground">Industrial Decision Intelligence</p>
          </div>
        </div>
        {response && (
          <ConfidenceIndicator confidence={response.confidence} />
        )}
      </div>

      <ScrollArea ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="space-y-1 py-4">
          {messages.length === 0 && !isStreaming ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="rounded-full bg-primary/10 p-4 mb-4">
                <Bot className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-xl font-semibold mb-2">How can I help you?</h2>
              <p className="text-sm text-muted-foreground text-center max-w-md mb-8">
                Ask me about asset status, incidents, maintenance, risk analysis,
                or enterprise knowledge documents.
              </p>
              <div className="grid gap-2 w-full max-w-lg">
                {DEFAULT_SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => { setInput(s); }}
                    className="flex items-center gap-2 rounded-lg border bg-muted/30 px-4 py-2.5 text-left text-sm hover:bg-muted/60 transition-colors"
                  >
                    <Lightbulb className="h-4 w-4 shrink-0 text-amber-500" />
                    <span>{s}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, i) => (
                <div key={i} className={cn(
                  "px-4 py-3",
                  msg.role === "assistant" && "bg-muted/20",
                )}>
                  <div className="mx-auto max-w-3xl">
                    <div className="flex gap-3">
                      <div className={cn(
                        "mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                        msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
                      )}>
                        {msg.role === "user" ? (
                          <User className="h-4 w-4" />
                        ) : (
                          <Bot className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        {msg.role === "user" ? (
                          <p className="text-sm font-medium">{msg.content}</p>
                        ) : (
                          <>
                            <MarkdownContent content={msg.content} />
                            {i === messages.length - 1 && !isStreaming && (
                              <>
                                {renderCitations()}
                                {response && (
                                  <div className="flex items-center gap-2 mt-3">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className={cn("h-7 w-7 p-0", feedbackGiven[i] === "up" && "text-emerald-500")}
                                      onClick={() => {
                                        setFeedbackGiven((prev) => ({ ...prev, [i]: "up" }));
                                      }}
                                    >
                                      <ThumbsUp className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className={cn("h-7 w-7 p-0", feedbackGiven[i] === "down" && "text-red-500")}
                                      onClick={() => {
                                        setFeedbackGiven((prev) => ({ ...prev, [i]: "down" }));
                                      }}
                                    >
                                      <ThumbsDown className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                )}
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {isStreaming && renderThinkingIndicator()}
            </>
          )}
        </div>
      </ScrollArea>

      {response?.suggested_prompts && response.suggested_prompts.length > 0 && messages.length > 0 && !isStreaming && (
        <div className="border-t bg-muted/10 px-4 py-2">
          <div className="mx-auto flex max-w-3xl flex-wrap gap-1.5">
            {response.suggested_prompts.slice(0, 3).map((prompt, i) => (
              <button
                key={i}
                onClick={() => {
                  setInput(prompt);
                }}
                className="flex items-center gap-1 rounded-full border bg-background px-3 py-1 text-[11px] text-muted-foreground hover:bg-muted transition-colors"
              >
                <Lightbulb className="h-3 w-3" />
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="border-t bg-background px-4 py-3">
        <div className="mx-auto flex max-w-3xl items-end gap-2">
          <div className="relative flex-1">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about assets, incidents, risk, or documents..."
              className="flex min-h-[2.5rem] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              rows={1}
              disabled={isStreaming}
            />
          </div>
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            className="shrink-0"
          >
            {isStreaming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
