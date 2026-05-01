"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LayoutDashboard, Package, ShoppingCart, Key, LogOut, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

interface AdminSidebarProps {
  locale: string;
}

export function AdminSidebar({ locale }: AdminSidebarProps) {
  const pathname = usePathname();
  const t = useTranslations("admin");

  const navItems = [
    { href: `/${locale}/admin/dashboard`, label: t("dashboard"), icon: LayoutDashboard },
    { href: `/${locale}/admin/products`, label: t("navProducts"), icon: Package },
    { href: `/${locale}/admin/orders`, label: t("navOrders"), icon: ShoppingCart },
    { href: `/${locale}/admin/licenses`, label: t("navLicenses"), icon: Key },
  ];

  return (
    <aside className="flex w-64 flex-col border-e bg-card">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <ShoppingBag className="h-6 w-6 text-primary" />
        <span className="font-bold">Admin Panel</span>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-3">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground"
          onClick={() => signOut({ callbackUrl: `/${locale}/admin/login` })}
        >
          <LogOut className="h-4 w-4" />
          {t("signOut")}
        </Button>
      </div>
    </aside>
  );
}
