import type { Workspace } from "@/types";

export const MOCK_WORKSPACES: Workspace[] = [
  {
    id: "ws-1",
    name: "Acme Corp",
    slug: "acme-corp",
    plan: "pro",
    stripe_customer_id: null,
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "ws-2",
    name: "Freelance",
    slug: "freelance",
    plan: "free",
    stripe_customer_id: null,
    created_at: "2024-03-15T00:00:00Z",
  },
];

export const MOCK_ACTIVE_WORKSPACE = MOCK_WORKSPACES[0];
