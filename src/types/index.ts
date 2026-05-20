export type Plan = "free" | "pro" | "payment_failed";

export type WorkspaceRole = "admin" | "member";

export type LeadStatus = "active" | "inactive" | "converted" | "lost";

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

export interface Lead {
  id: string;
  workspace_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  role: string | null;
  status: LeadStatus;
  owner_id: string | null;
  created_at: string;
}

export interface Deal {
  id: string;
  workspace_id: string;
  lead_id: string;
  title: string;
  value: number | null;
  stage: DealStage;
  owner_id: string | null;
  due_date: string | null;
  position: number;
  created_at: string;
  lead?: Pick<Lead, "id" | "name" | "company" | "email">;
}

export interface Activity {
  id: string;
  workspace_id: string;
  lead_id: string;
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
