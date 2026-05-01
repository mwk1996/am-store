"use client";

import { usePathname, useRouter } from "next/navigation";
import { Globe } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Button } from "@/components/ui/button";

const locales = [
  { code: "en", label: "English" },
  { code: "ar", label: "العربية" },
  { code: "tr", label: "Türkçe" },
  { code: "ku", label: "کوردی" },
];

interface LocaleSwitcherProps {
  currentLocale: string;
  label: string;
}

export function LocaleSwitcher({ currentLocale, label }: LocaleSwitcherProps) {
  const pathname = usePathname();
  const router = useRouter();

  function switchLocale(newLocale: string) {
    // Replace the locale segment in the path
    const segments = pathname.split("/");
    segments[1] = newLocale;
    router.push(segments.join("/"));
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">{label}</span>
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="z-50 min-w-[140px] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
          align="end"
          sideOffset={4}
        >
          {locales.map((loc) => (
            <DropdownMenu.Item
              key={loc.code}
              onSelect={() => switchLocale(loc.code)}
              className={`flex cursor-pointer items-center rounded-sm px-3 py-2 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground ${
                loc.code === currentLocale ? "font-semibold" : ""
              }`}
            >
              {loc.label}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
