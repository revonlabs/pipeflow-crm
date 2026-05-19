export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#0A0A0F]">
      {/* Orbs de fundo */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-[#1B2559] opacity-40 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -right-20 h-[400px] w-[400px] rounded-full bg-[#4F8EF7] opacity-20 blur-3xl"
      />

      <div className="relative z-10 w-full max-w-md px-4 py-12">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#4F8EF7]">
            <svg
              viewBox="0 0 20 20"
              fill="none"
              className="h-6 w-6 text-white"
              aria-hidden
            >
              <path
                d="M10 2L3 7v11h5v-5h4v5h5V7L10 2z"
                fill="currentColor"
              />
            </svg>
          </div>
          <span className="text-xl font-semibold tracking-tight text-white">
            PipeFlow
          </span>
        </div>

        {children}
      </div>
    </div>
  );
}
