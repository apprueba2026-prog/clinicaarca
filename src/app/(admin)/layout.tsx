import { SideNavBar } from "@/components/layout/side-nav-bar";
import { AdminTopBar } from "@/components/layout/admin-top-bar";
import { AdminAIPanel } from "@/components/shared/admin-ai-panel";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface">
      <SideNavBar />
      <AdminTopBar />
      <main className="ml-64 pt-24 p-8">{children}</main>
      <AdminAIPanel />
    </div>
  );
}
