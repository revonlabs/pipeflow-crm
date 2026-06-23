export type Plan = "free" | "pro" | "payment_failed";

export type WorkspaceRole = "admin" | "member";

export type LeadStatus = "active" | "inactive" | "converted" | "lost";

export type LeadSource = "manual" | "meta_ads" | "google_ads" | "organic" | "proposal";

export type DealStage =
  | "new_lead"
  | "contacted"
  | "proposal_sent"
  | "negotiation"
  | "won"
  | "lost";

export type ActivityType = "call" | "email" | "meeting" | "note";

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  plan: Plan;
  stripe_customer_id: string | null;
  created_at: string;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: WorkspaceRole;
  created_at: string;
  user?: {
    id: string;
    email: string;
    user_metadata?: { full_name?: string };
  };
}

export interface Invite {
  id: string;
  workspace_id: string;
  email: string;
  token: string;
  role: WorkspaceRole;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}

export interface Tag {
  id: string;
  workspace_id: string;
  name: string;
  created_at: string;
}

export interface LostReason {
  id: string;
  workspace_id: string;
  name: string;
  created_at: string;
}

export interface Lead {
  id: string;
  workspace_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  role: string | null;
  status: LeadStatus;
  source: LeadSource | null;
  cnpj: string | null;
  owner_id: string | null;
  created_at: string;
  tags?: Tag[];
}

export interface Task {
  id: string;
  workspace_id: string;
  deal_id: string;
  title: string;
  due_at: string;
  completed_at: string | null;
  created_by: string | null;
  created_at: string;
}

export interface Deal {
  id: string;
  workspace_id: string;
  lead_id: string;
  title: string;
  value: number | null;
  recurring_value: number;
  setup_value: number;
  stage: DealStage;
  owner_id: string | null;
  due_date: string | null;
  position: number;
  created_at: string;
  lost_reason_id: string | null;
  lead?: Pick<Lead, "id" | "name" | "company" | "email">;
  next_task?: Pick<Task, "id" | "due_at" | "title"> | null;
  lost_reason?: Pick<LostReason, "id" | "name"> | null;
}

export interface Activity {
  id: string;
  workspace_id: string;
  lead_id: string;
  deal_id: string | null;
  type: ActivityType;
  description: string;
  author_id: string | null;
  created_at: string;
  author?: {
    id: string;
    email: string;
    user_metadata?: { full_name?: string };
  };
}

export interface Subscription {
  workspace_id: string;
  stripe_subscription_id: string | null;
  status: string;
  current_period_end: string | null;
}

export interface WorkspaceContext {
  workspace: Workspace;
  role: WorkspaceRole;
  allWorkspaces: Workspace[];
}

// ─── Módulo WhatsApp Monitor (wa_*) ─────────────────────────────────────────

export type WaInstanceStatus = "connected" | "disconnected" | "qr_pending" | "banned";

export type WaConversationStatus = "active" | "archived";

export type WaMessageDirection = "in" | "out";

export type WaMessageSentBy = "contact" | "vendor" | "admin_intervention" | "automation";

export type WaMessageContentType =
  | "text"
  | "image"
  | "audio"
  | "video"
  | "document"
  | "location"
  | "contact"
  | "sticker";

export type WaMessageStatus = "sent" | "delivered" | "read" | "failed";

export type WaWebhookQueueStatus = "pending" | "processing" | "done" | "failed" | "dead";

export type WaAuditAction =
  | "view_conversation"
  | "view_dashboard"
  | "send_intervention"
  | "export_data"
  | "change_settings"
  | "login"
  | "logout";

export interface WaInstance {
  id: string;
  workspace_id: string;
  evolution_instance_name: string;
  phone_number: string;
  display_name: string;
  owner_user_id: string | null;
  status: WaInstanceStatus;
  webhook_secret: string;
  webhook_token: string;
  last_seen_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WaContact {
  id: string;
  workspace_id: string;
  phone_number: string;
  display_name: string | null;
  profile_pic_url: string | null;
  is_blocked: boolean;
  anonymized_at: string | null;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WaConversation {
  id: string;
  workspace_id: string;
  instance_id: string;
  contact_id: string;
  status: WaConversationStatus;
  last_message_at: string | null;
  last_message_preview: string | null;
  unread_count: number;
  first_response_at: string | null;
  sla_breach_at: string | null;
  created_at: string;
  updated_at: string;
  instance?: Pick<WaInstance, "id" | "display_name" | "phone_number">;
  contact?: Pick<WaContact, "id" | "display_name" | "phone_number">;
}

export interface WaMessage {
  id: string;
  workspace_id: string;
  conversation_id: string;
  evolution_message_id: string;
  direction: WaMessageDirection;
  sent_by: WaMessageSentBy;
  intervention_user_id: string | null;
  content_type: WaMessageContentType;
  content_text: string | null;
  media_url: string | null;
  media_mime: string | null;
  media_size_bytes: number | null;
  metadata: Record<string, unknown> | null;
  status: WaMessageStatus | null;
  timestamp_wa: string;
  received_at: string;
}

export interface WaWebhookQueueItem {
  id: number;
  workspace_id: string;
  instance_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  received_at: string;
  processed_at: string | null;
  attempts: number;
  next_attempt_at: string;
  last_error: string | null;
  status: WaWebhookQueueStatus;
}

export interface WaAuditLog {
  id: number;
  workspace_id: string;
  user_id: string;
  action: WaAuditAction;
  target_type: string | null;
  target_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface WaResponseMetrics {
  workspace_id: string;
  instance_id: string;
  date: string;
  total_in: number;
  total_out: number;
  unique_contacts: number;
  conversations_started: number;
  conversations_unanswered_1h: number;
  avg_first_response_seconds: number | null;
  avg_response_seconds: number | null;
  peak_hour: number | null;
  updated_at: string;
}
