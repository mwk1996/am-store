import { redirect } from "next/navigation";

interface AdminIndexProps {
  params: { locale: string };
}

export default function AdminIndex({ params: { locale } }: AdminIndexProps) {
  redirect(`/${locale}/admin/dashboard`);
}
