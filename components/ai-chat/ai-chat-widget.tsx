"use client";

import { useState, useEffect, useRef } from "react";
import { Sparkles, X, Send, Loader2, Trash2, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

const TEMPLATE_PROMPTS = [
  "Analisis keuangan saya bulan ini",
  "Saran untuk keuangan saya",
  "Berapa nominal yang pas untuk menabung dengan gaji saya?",
  "Apakah pengeluaran saya termasuk boros?",
  "Bantu saya bikin anggaran bulanan",
];

export function AiChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [usage, setUsage] = useState<{ used: number; limit: number; remaining: number } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const tempIdCounter = useRef(0);

  async function loadHistory() {
    setLoadingHistory(true);
    try {
      const res = await fetch("/api/ai/chat");
      const data = await res.json();
      setMessages(data.messages ?? []);
      setUsage(data.usage ?? null);
    } finally {
      setLoadingHistory(false);
    }
  }

  useEffect(() => {
    if (open && messages.length === 0) {
      loadHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;
    if (usage && usage.remaining <= 0) {
      toast.error(`Batas ${usage.limit} pesan hari ini sudah tercapai. Coba lagi besok.`);
      return;
    }

    tempIdCounter.current += 1;
    const tempUserMsg: ChatMessage = {
      id: `temp-${tempIdCounter.current}`,
      role: "user",
      content: text,
      createdAt: "",
    };
    setMessages((m) => [...m, tempUserMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Gagal mengirim pesan");
        setMessages((m) => m.filter((msg) => msg.id !== tempUserMsg.id));
        if (data.usage) setUsage(data.usage);
        return;
      }

      tempIdCounter.current += 1;
      setMessages((m) => [
        ...m,
        { id: `reply-${tempIdCounter.current}`, role: "assistant", content: data.reply, createdAt: "" },
      ]);
      setUsage(data.usage ?? null);
    } catch {
      toast.error("Terjadi kesalahan, coba lagi");
      setMessages((m) => m.filter((msg) => msg.id !== tempUserMsg.id));
    } finally {
      setLoading(false);
    }
  }

  async function handleClearHistory() {
    await fetch("/api/ai/chat", { method: "DELETE" });
    setMessages([]);
    toast.success("Riwayat chat dihapus");
  }

  return (
    <>
      {/* Tombol floating */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-40 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:opacity-90 transition-opacity"
          aria-label="Buka Asisten AI"
        >
          <Sparkles className="h-6 w-6" />
        </button>
      )}

      {/* Panel chat */}
      {open && (
        <div className="fixed bottom-0 md:bottom-6 right-0 md:right-6 z-40 w-full md:w-96 h-[85vh] md:h-[600px] max-h-[85vh] bg-card border border-border md:rounded-2xl shadow-2xl flex flex-col overflow-hidden dropdown-pop">
          {/* Header */}
          <div className="flex items-center justify-between px-4 h-14 border-b border-border shrink-0">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary-soft text-primary flex items-center justify-center">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Asisten Duwitku</p>
                {usage && (
                  <p className="text-[10px] text-muted-foreground">{usage.remaining}/{usage.limit} pesan tersisa hari ini</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  onClick={handleClearHistory}
                  className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors"
                  title="Hapus riwayat"
                >
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
            {loadingHistory ? (
              <div className="flex flex-col gap-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="skeleton h-14 rounded-xl" />
                ))}
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col gap-4 py-4">
                <div className="text-center">
                  <div className="h-12 w-12 rounded-full bg-primary-soft text-primary flex items-center justify-center mx-auto mb-3">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-medium text-foreground">Halo! Aku Asisten Duwitku</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Tanya apa aja soal kondisi keuanganmu, atau pilih salah satu topik di bawah:
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  {TEMPLATE_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => sendMessage(prompt)}
                      className="text-left text-xs text-foreground bg-secondary hover:bg-secondary/70 transition-colors rounded-lg px-3 py-2.5"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-secondary text-foreground rounded-bl-sm"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))
            )}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-secondary rounded-2xl rounded-bl-sm px-3.5 py-2.5 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" />
                </div>
              </div>
            )}
          </div>

          {/* Input - selalu keliatan, gak ketutupan konten lain */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
            className="flex items-center gap-2 p-3 border-t border-border shrink-0"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tanya soal keuanganmu..."
              disabled={loading}
              className="flex-1 h-10 rounded-lg bg-secondary px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <Button type="submit" size="icon" disabled={loading || !input.trim()}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
