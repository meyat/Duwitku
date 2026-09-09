"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { formatDate } from "@/lib/utils";

interface GroupChatMessage {
  id: string;
  content: string;
  createdAt: string;
  user: { id: string; name: string };
}

export default function GroupChatPage() {
  const params = useParams();
  const { data: session } = useSession();
  const groupId = params.id as string;

  const [groupName, setGroupName] = useState("");
  const [messages, setMessages] = useState<GroupChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastFetchRef = useRef<string | null>(null);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    const [groupRes, chatRes] = await Promise.all([
      fetch(`/api/groups/${groupId}`),
      fetch(`/api/groups/${groupId}/chat`),
    ]);
    if (groupRes.ok) {
      const g = await groupRes.json();
      setGroupName(g.name);
    }
    if (chatRes.ok) {
      const msgs = await chatRes.json();
      setMessages(msgs);
      if (msgs.length) lastFetchRef.current = msgs[msgs.length - 1].createdAt;
    }
    setLoading(false);
  }, [groupId]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  // Polling ringan tiap 5 detik buat pesan baru dari anggota lain
  useEffect(() => {
    const interval = setInterval(async () => {
      const url = lastFetchRef.current
        ? `/api/groups/${groupId}/chat?after=${encodeURIComponent(lastFetchRef.current)}`
        : `/api/groups/${groupId}/chat`;
      const res = await fetch(url);
      if (!res.ok) return;
      const newMsgs: GroupChatMessage[] = await res.json();
      if (newMsgs.length) {
        setMessages((m) => [...m, ...newMsgs]);
        lastFetchRef.current = newMsgs[newMsgs.length - 1].createdAt;
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [groupId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || sending) return;
    setSending(true);
    const text = input;
    setInput("");

    try {
      const res = await fetch(`/api/groups/${groupId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
      if (res.ok) {
        const msg = await res.json();
        setMessages((m) => [...m, msg]);
        lastFetchRef.current = msg.createdAt;
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-6rem)]">
      <div className="flex items-center gap-3 pb-4 shrink-0">
        <Link href={`/groups/${groupId}`} className="h-9 w-9 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors">
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </Link>
        <h1 className="text-lg font-semibold text-foreground truncate">{groupName || "Chat Grup"}</h1>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto flex flex-col gap-3 px-1">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-12 rounded-xl" />)
        ) : messages.length ? (
          messages.map((msg) => {
            const isMe = msg.user.id === session?.user?.id;
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                {!isMe && <span className="text-[10px] text-muted-foreground mb-0.5 ml-1">{msg.user.name}</span>}
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap ${
                    isMe ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-secondary text-foreground rounded-bl-sm"
                  }`}
                >
                  {msg.content}
                </div>
                <span className="text-[10px] text-muted-foreground mt-0.5">{formatDate(msg.createdAt)}</span>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-muted-foreground text-center py-10">
            Belum ada pesan. Mulai obrolan sama anggota grup kamu!
          </p>
        )}
      </div>

      <form onSubmit={handleSend} className="flex items-center gap-2 pt-3 shrink-0">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Tulis pesan..."
          disabled={sending}
          className="flex-1 h-11 rounded-lg bg-secondary px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <Button type="submit" size="icon" disabled={sending || !input.trim()}>
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  );
}
