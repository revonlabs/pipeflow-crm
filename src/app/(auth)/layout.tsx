import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#060B14]">
      {/* Orbs de fundo */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-crm-surface-2 opacity-40 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -right-20 h-[400px] w-[400px] rounded-full bg-crm-accent opacity-20 blur-3xl"
      />

      <div className="relative z-10 w-full max-w-md px-4 py-12">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <Image
            src="/Logo CRM.png"
            alt="Revon Studio CRM"
            width={180}
            height={46}
            className="h-11 w-auto"
            priority
          />
        </div>

        {children}
      </div>
    </div>
  );
}
