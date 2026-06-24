import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/workspace";
import { Sidebar } from "@/components/layout/sidebar";
import { Navbar } from "@/components/layout/navbar";
import { DarkModeEnforcer } from "@/components/layout/dark-mode-enforcer";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const ctx = await getWorkspaceContext();

  // Usuário autenticado mas sem workspace → precisa fazer onboarding
  if (!ctx) redirect("/onboarding");

  const userName = (user.user_metadata?.full_name as string | undefined) ?? "";
  const userEmail = user.email ?? "";

  return (
    <>
      <DarkModeEnforcer />

      <div className="flex h-screen overflow-hidden bg-background">
        <div className="hidden md:flex md:shrink-0">
          <Sidebar
            activeWorkspace={ctx.workspace}
            allWorkspaces={ctx.allWorkspaces}
            role={ctx.role}
          />
        </div>

        <div className="flex flex-1 flex-col overflow-hidden">
          <Navbar
            userName={userName}
            userEmail={userEmail}
            activeWorkspace={ctx.workspace}
            allWorkspaces={ctx.allWorkspaces}
            role={ctx.role}
          />
          <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
        </div>
      </div>
    </>
  );
}
