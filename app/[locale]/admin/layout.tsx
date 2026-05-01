import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SessionProvider } from "@/components/admin/session-provider";
import { AdminSidebar } from "@/components/admin/sidebar";

interface AdminLayoutProps {
  children: React.ReactNode;
  params: { locale: string };
}

export default async function AdminLayout({ children, params: { locale } }: AdminLayoutProps) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect(`/${locale}/admin/login`);
  }

  return (
    <SessionProvider session={session}>
      <div className="flex min-h-screen bg-muted/20">
        <AdminSidebar locale={locale} />
        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</div>
        </main>
      </div>
    </SessionProvider>
  );
}
