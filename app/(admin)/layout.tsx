import { AdminShell } from "@/features/store-wallet/ui/admin-shell";
import { AuthGuard } from "@/features/store-wallet/auth/auth-guard";

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
