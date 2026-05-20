export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      workspaces: {
        Row: {
          id: string
          name: string
          slug: string
          plan: 'free' | 'pro' | 'payment_failed'
          owner_id: string | null
          stripe_customer_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          plan?: 'free' | 'pro' | 'payment_failed'
          owner_id?: string | null
          stripe_customer_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          plan?: 'free' | 'pro' | 'payment_failed'
          owner_id?: string | null
          stripe_customer_id?: string | null
          created_at?: string
        }
      }
      workspace_members: {
        Row: {
          id: string
          workspace_id: string
          user_id: string
          role: 'admin' | 'member'
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          user_id: string
          role?: 'admin' | 'member'
          created_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          user_id?: string
          role?: 'admin' | 'member'
          created_at?: string
        }
      }
      leads: {
        Row: {
          id: string
          workspace_id: string
          name: string
          email: string | null
          phone: string | null
          company: string | null
          role: string | null
          status: 'active' | 'inactive' | 'converted' | 'lost'
          owner_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          name: string
          email?: string | null
          phone?: string | null
          company?: string | null
          role?: string | null
          status?: 'active' | 'inactive' | 'converted' | 'lost'
          owner_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          name?: string
          email?: string | null
          phone?: string | null
          company?: string | null
          role?: string | null
          status?: 'active' | 'inactive' | 'converted' | 'lost'
          owner_id?: string | null
          created_at?: string
        }
      }
      deals: {
        Row: {
          id: string
          workspace_id: string
          lead_id: string | null
          title: string
          value: number | null
          stage: 'new_lead' | 'contacted' | 'proposal_sent' | 'negotiation' | 'won' | 'lost'
          position: number
          owner_id: string | null
          due_date: string | null
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          lead_id?: string | null
          title: string
          value?: number | null
          stage?: 'new_lead' | 'contacted' | 'proposal_sent' | 'negotiation' | 'won' | 'lost'
          position?: number
          owner_id?: string | null
          due_date?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          lead_id?: string | null
          title?: string
          value?: number | null
          stage?: 'new_lead' | 'contacted' | 'proposal_sent' | 'negotiation' | 'won' | 'lost'
          position?: number
          owner_id?: string | null
          due_date?: string | null
          created_at?: string
        }
      }
      activities: {
        Row: {
          id: string
          workspace_id: string
          lead_id: string
          type: 'call' | 'email' | 'meeting' | 'note'
          description: string
          author_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          lead_id: string
          type: 'call' | 'email' | 'meeting' | 'note'
          description: string
          author_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          lead_id?: string
          type?: 'call' | 'email' | 'meeting' | 'note'
          description?: string
          author_id?: string | null
          created_at?: string
        }
      }
      subscriptions: {
        Row: {
          workspace_id: string
          stripe_subscription_id: string | null
          status: string | null
          current_period_end: string | null
        }
        Insert: {
          workspace_id: string
          stripe_subscription_id?: string | null
          status?: string | null
          current_period_end?: string | null
        }
        Update: {
          workspace_id?: string
          stripe_subscription_id?: string | null
          status?: string | null
          current_period_end?: string | null
        }
      }
    }
    Views: Record<string, never>
    Functions: {
      create_workspace: {
        Args: { workspace_name: string; workspace_slug: string }
        Returns: string
      }
    }
    Enums: Record<string, never>
  }
}
