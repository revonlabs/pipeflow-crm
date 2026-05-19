import { Sidebar } from "@/components/layout/sidebar";
import { Navbar } from "@/components/layout/navbar";
import { DarkModeEnforcer } from "@/components/layout/dark-mode-enforcer";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Garante dark no <html> para portais Radix (Dropdown, Sheet, Dialog) */}
      <DarkModeEnforcer />

      <div className="flex h-screen overflow-hidden bg-background">
        {/* Sidebar fixa — oculta em mobile, visível em md+ */}
        <div className="hidden md:flex md:shrink-0">
          <Sidebar />
        </div>

        {/* Área principal */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <Navbar />
          <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
        </div>
      </div>
    </>
  );
}
