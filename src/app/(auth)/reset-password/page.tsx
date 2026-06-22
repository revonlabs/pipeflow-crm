import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = { title: "Definir nova senha — Revon Studio CRM" };

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
