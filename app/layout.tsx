import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Software License Store",
  description: "Purchase premium software licenses instantly.",
};

// Root layout is intentionally minimal — lang/dir/body styles are set in app/[locale]/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children as React.ReactElement;
}
