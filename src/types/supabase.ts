export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '14.5'
  }
  internal: {
    Tables: { [_ in never]: never }
    Views: { [_ in never]: never }
    Functions: {
      is_workspace_member: {
        Args: { p_workspace_id: string }
        Returns: boolean
      }
    }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
  public: {
    Tables: {
      activities: {
        Row: {
          author_id: string | null
          created_at: string
          description: string
          id: string
          lead_id: string
          type: 'call' | 'email' | 'meeting' | 'note'
          workspace_id: string
        }
        Insert: {
          author_id?: string | null
          created_at?: string
          description: string
          id?: string
          lead_id: string
          type: 'call' | 'email' | 'meeting' | 'note'
          workspace_id: string
        }
        Update: {
          author_id?: string | null
          created_at?: string
          description?: string
          id?: string
          lead_id?: string
          type?: 'call' | 'email' | 'meeting' | 'note'
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'activities_lead_id_fkey'
            columns: ['lead_id']
            isOneToOne: false
            referencedRelation: 'leads'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'activities_workspace_id_fkey'
            columns: ['workspace_id']
            isOneToOne: false
            referencedRelation: 'workspaces'
            referencedColumns: ['id']
          },
        ]
      }
      deals: {
        Row: {
          created_at: string
          due_date: string | null
          id: string
          lead_id: string | null
          owner_id: string | null
          position: number
          stage: 'new_lead' | 'contacted' | 'proposal_sent' | 'negotiation' | 'won' | 'lost'
          title: string
          value: number | null
          workspace_id: string
        }
        Insert: {
          created_at?: string
          due_date?: string | null
          id?: string
          lead_id?: string | null
          owner_id?: string | null
          position?: number
          stage?: 'new_lead' | 'contacted' | 'proposal_sent' | 'negotiation' | 'won' | 'lost'
          title: string
          value?: number | null
          workspace_id: string
        }
        Update: {
          created_at?: string
          due_date?: string | null
          id?: string
          lead_id?: string | null
          owner_id?: string | null
          position?: number
          stage?: 'new_lead' | 'contacted' | 'proposal_sent' | 'negotiation' | 'won' | 'lost'
          title?: string
          value?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'deals_lead_id_fkey'
            columns: ['lead_id']
            isOneToOne: false
            referencedRelation: 'leads'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'deals_workspace_id_fkey'
            columns: ['workspace_id']
            isOneToOne: false
            referencedRelation: 'workspaces'
            referencedColumns: ['id']
          },
        ]
      }
      leads: {
        Row: {
          company: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          owner_id: string | null
          phone: string | null
          role: string | null
          status: 'active' | 'inactive' | 'converted' | 'lost'
          workspace_id: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          owner_id?: string | null
          phone?: string | null
          role?: string | null
          status?: 'active' | 'inactive' | 'converted' | 'lost'
          workspace_id: string
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          owner_id?: string | null
          phone?: string | null
          role?: string | null
          status?: 'active' | 'inactive' | 'converted' | 'lost'
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'leads_workspace_id_fkey'
            columns: ['workspace_id']
            isOneToOne: false
            referencedRelation: 'workspaces'
            referencedColumns: ['id']
          },
        ]
      }
      subscriptions: {
        Row: {
          current_period_end: string | null
          status: string | null
          stripe_subscription_id: string | null
          workspace_id: string
        }
        Insert: {
          current_period_end?: string | null
          status?: string | null
          stripe_subscription_id?: string | null
          workspace_id: string
        }
        Update: {
          current_period_end?: string | null
          status?: string | null
          stripe_subscription_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'subscriptions_workspace_id_fkey'
            columns: ['workspace_id']
            isOneToOne: true
            referencedRelation: 'workspaces'
            referencedColumns: ['id']
          },
        ]
      }
      workspace_invites: {
        Row: {
          id: string
          workspace_id: string
          email: string
          token: string
          role: 'admin' | 'member'
          expires_at: string
          accepted_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          email: string
          token?: string
          role?: 'admin' | 'member'
          expires_at?: string
          accepted_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          email?: string
          token?: string
          role?: 'admin' | 'member'
          expires_at?: string
          accepted_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'workspace_invites_workspace_id_fkey'
            columns: ['workspace_id']
            isOneToOne: false
            referencedRelation: 'workspaces'
            referencedColumns: ['id']
          },
        ]
      }
      workspace_members: {
        Row: {
          created_at: string
          id: string
          role: 'admin' | 'member'
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: 'admin' | 'member'
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: 'admin' | 'member'
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'workspace_members_workspace_id_fkey'
            columns: ['workspace_id']
            isOneToOne: false
            referencedRelation: 'workspaces'
            referencedColumns: ['id']
          },
        ]
      }
      processed_stripe_events: {
        Row: {
          event_id: string
          processed_at: string
        }
        Insert: {
          event_id: string
          processed_at?: string
        }
        Update: {
          event_id?: string
          processed_at?: string
        }
        Relationships: []
      }
      workspaces: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string | null
          plan: 'free' | 'pro' | 'payment_failed'
          slug: string
          stripe_customer_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_id?: string | null
          plan?: 'free' | 'pro' | 'payment_failed'
          slug: string
          stripe_customer_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string | null
          plan?: 'free' | 'pro' | 'payment_failed'
          slug?: string
          stripe_customer_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_workspace: {
        Args: { workspace_name: string; workspace_slug: string }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never
