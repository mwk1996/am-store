"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { ArrowLeft } from "lucide-react";

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) ?? "en";
  const orderId = params?.orderId as string;

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [receiverId, setReceiverId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [orderTitle, setOrderTitle] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("auth_token");
    if (!storedToken) { router.push(`/${locale}/login`); return; }
    setToken(storedToken);

    Promise.all([
      fetch("/api/auth/me", { headers: { Authorization: `Bearer ${storedToken}` } }),
      fetch(`/api/orders/${orderId}`, { headers: { Authorization: `Bearer ${storedToken}` } }),
    ]).then(async ([meRes, orderRes]) => {
      let myId = "";
      if (meRes.ok) {
        const me = await meRes.json();
        setCurrentUserId(me.id);
        myId = me.id;
      }
      if (orderRes.ok) {
        const order = await orderRes.json();
        setOrderTitle(order.product?.title ?? `Order #${orderId.slice(0, 8)}`);
        // The other party is whoever isn't us
        const other = order.buyer?.id === myId ? order.seller?.id : order.buyer?.id;
        setReceiverId(other ?? null);
      }
    }).finally(() => setLoading(false));
  }, [orderId, locale, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background bg-grid">
      <Nav locale={locale} />

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <Link
          href={`/${locale}/orders/${orderId}`}
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Order
        </Link>

        <h1 className="mb-2 text-2xl font-bold text-foreground">Chat</h1>
        <p className="mb-6 text-sm text-muted-foreground">{orderTitle}</p>

        <div className="rounded-2xl border border-white/8 bg-card/60 backdrop-blur-sm overflow-hidden" style={{ height: "600px" }}>
          {receiverId && token && (
            <ChatWindow
              orderId={orderId}
              currentUserId={currentUserId ?? ""}
              receiverId={receiverId}
              token={token}
            />
          )}
        </div>
      </main>

      <Footer locale={locale} />
    </div>
  );
}
