"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Message {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender: { id: string; name: string; avatar?: string | null };
}

interface ChatWindowProps {
  orderId: string;
  currentUserId: string;
  receiverId: string;
  token: string;
}

export function ChatWindow({ orderId, currentUserId, receiverId, token }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/messages/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    pollRef.current = setInterval(fetchMessages, 5000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [orderId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!content.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ receiverId, orderId, content: content.trim() }),
      });
      if (res.ok) {
        setContent("");
        await fetchMessages();
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl flex flex-col h-96">
      <div className="px-4 py-3 border-b border-gray-700">
        <h3 className="text-white font-semibold text-sm">Order Chat</h3>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="w-5 h-5 text-gray-500 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-center text-gray-500 text-sm mt-8">
            No messages yet. Start the conversation.
          </p>
        ) : (
          messages.map((msg) => {
            const isMine = msg.senderId === currentUserId;
            return (
              <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                    isMine
                      ? "bg-indigo-600 text-white rounded-br-sm"
                      : "bg-gray-700 text-gray-100 rounded-bl-sm"
                  }`}
                >
                  {!isMine && (
                    <p className="text-xs text-gray-400 mb-1 font-medium">{msg.sender.name}</p>
                  )}
                  <p>{msg.content}</p>
                  <p className={`text-xs mt-1 ${isMine ? "text-indigo-300" : "text-gray-500"}`}>
                    {new Date(msg.createdAt).toLocaleTimeString(undefined, {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-gray-700 flex gap-2">
        <Input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
          placeholder="Type a message..."
          className="bg-gray-900 border-gray-600 text-white placeholder-gray-500 focus:border-indigo-500"
        />
        <Button
          onClick={send}
          disabled={!content.trim() || sending}
          size="icon"
          className="bg-indigo-600 hover:bg-indigo-700 flex-shrink-0"
        >
          {sending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
