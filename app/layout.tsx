import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Software License Store",
  description: "Purchase premium software licenses instantly.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning>
      <body className="bg-background">{children}</body>
    </html>
  );
}
