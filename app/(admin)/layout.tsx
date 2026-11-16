import { AdminShell } from "@/features/admin/ui/admin-shell";
import { AuthGuard } from "@/features/auth/ui/auth-guard";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthGuard>
      <AdminShell>{children}</AdminShell>
    </AuthGuard>
  );
}
