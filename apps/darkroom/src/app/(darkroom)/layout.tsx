import { Sidebar } from "@/components/layout/sidebar";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DarkroomLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await getSession();

  if (!user) {
    redirect("https://sm.macalister.nz/login?redirect=darkroom");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-dark-bg text-white/90">
      <Sidebar user={user} />
      <main className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
