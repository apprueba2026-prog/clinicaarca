import { TopNavBar } from "@/components/layout/top-nav-bar";
import { Footer } from "@/components/layout/footer";
import { AIFab } from "@/components/shared/ai-fab";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <TopNavBar />
      <main className="flex-1">{children}</main>
      <Footer />
      <AIFab />
    </>
  );
}
