import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = { title: "Recuperar senha — Revon Studio CRM" };

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
