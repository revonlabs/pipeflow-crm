export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          author_id: string | null
          created_at: string
          deal_id: string | null
          description: string
          id: string
          lead_id: string
          type: string
          workspace_id: string
        }
        Insert: {
          author_id?: string | null
          created_at?: string
          deal_id?: string | null
          description: string
          id?: string
          lead_id: string
          type: string
          workspace_id: string
        }
        Update: {
          author_id?: string | null
          created_at?: string
          deal_id?: string | null
          description?: string
          id?: string
          lead_id?: string
          type?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          created_at: string
          due_date: string | null
          id: string
          lead_id: string | null
          lost_reason_id: string | null
          owner_id: string | null
          position: number
          recurring_value: number
          setup_value: number
          stage: string
          title: string
          value: number | null
          workspace_id: string
        }
        Insert: {
          created_at?: string
          due_date?: string | null
          id?: string
          lead_id?: string | null
          lost_reason_id?: string | null
          owner_id?: string | null
          position?: number
          recurring_value?: number
          setup_value?: number
          stage?: string
          title: string
          value?: number | null
          workspace_id: string
        }
        Update: {
          created_at?: string
          due_date?: string | null
          id?: string
          lead_id?: string | null
          lost_reason_id?: string | null
          owner_id?: string | null
          position?: number
          recurring_value?: number
          setup_value?: number
          stage?: string
          title?: string
          value?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deals_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_lost_reason_id_fkey"
            columns: ["lost_reason_id"]
            isOneToOne: false
            referencedRelation: "lost_reasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_tags: {
        Row: {
          lead_id: string
          tag_id: string
        }
        Insert: {
          lead_id: string
          tag_id: string
        }
        Update: {
          lead_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_tags_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          cnpj: string | null
          company: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          owner_id: string | null
          phone: string | null
          role: string | null
          source: string | null
          status: string
          workspace_id: string
        }
        Insert: {
          cnpj?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          owner_id?: string | null
          phone?: string | null
          role?: string | null
          source?: string | null
          status?: string
          workspace_id: string
        }
        Update: {
          cnpj?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          owner_id?: string | null
          phone?: string | null
          role?: string | null
          source?: string | null
          status?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      lost_reasons: {
        Row: {
          created_at: string
          id: string
          name: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lost_reasons_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_admins: {
        Row: {
          created_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
        }
        Relationships: []
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
      propostas: {
        Row: {
          aberta_em: string | null
          cliente: string | null
          criada_em: string | null
          dados: Json
          deal_id: string | null
          id: string
          lead_id: string | null
          slug: string
          total_aberturas: number | null
        }
        Insert: {
          aberta_em?: string | null
          cliente?: string | null
          criada_em?: string | null
          dados: Json
          deal_id?: string | null
          id?: string
          lead_id?: string | null
          slug: string
          total_aberturas?: number | null
        }
        Update: {
          aberta_em?: string | null
          cliente?: string | null
          criada_em?: string | null
          dados?: Json
          deal_id?: string | null
          id?: string
          lead_id?: string | null
          slug?: string
          total_aberturas?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "propostas_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "propostas_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
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
            foreignKeyName: "subscriptions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          created_at: string
          id: string
          name: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tags_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string | null
          deal_id: string
          due_at: string
          id: string
          title: string
          workspace_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          deal_id: string
          due_at: string
          id?: string
          title?: string
          workspace_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          deal_id?: string
          due_at?: string
          id?: string
          title?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      wa_audit_log: {
        Row: {
          action: string
          created_at: string
          id: number
          ip_address: unknown
          metadata: Json | null
          target_id: string | null
          target_type: string | null
          user_agent: string | null
          user_id: string
          workspace_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: number
          ip_address?: unknown
          metadata?: Json | null
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
          user_id: string
          workspace_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: number
          ip_address?: unknown
          metadata?: Json | null
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
          user_id?: string
          workspace_id?: string
        }
        Relationships: []
      }
      wa_contacts: {
        Row: {
          anonymized_at: string | null
          created_at: string
          display_name: string | null
          id: string
          is_blocked: boolean
          key_version: number
          last_message_at: string | null
          phone_number: string
          profile_pic_url: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          anonymized_at?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          is_blocked?: boolean
          key_version?: number
          last_message_at?: string | null
          phone_number: string
          profile_pic_url?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          anonymized_at?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          is_blocked?: boolean
          key_version?: number
          last_message_at?: string | null
          phone_number?: string
          profile_pic_url?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wa_contacts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      wa_conversations: {
        Row: {
          contact_id: string
          created_at: string
          first_response_at: string | null
          id: string
          instance_id: string
          last_message_at: string | null
          last_message_preview: string | null
          sla_breach_at: string | null
          status: string
          unread_count: number
          updated_at: string
          workspace_id: string
        }
        Insert: {
          contact_id: string
          created_at?: string
          first_response_at?: string | null
          id?: string
          instance_id: string
          last_message_at?: string | null
          last_message_preview?: string | null
          sla_breach_at?: string | null
          status?: string
          unread_count?: number
          updated_at?: string
          workspace_id: string
        }
        Update: {
          contact_id?: string
          created_at?: string
          first_response_at?: string | null
          id?: string
          instance_id?: string
          last_message_at?: string | null
          last_message_preview?: string | null
          sla_breach_at?: string | null
          status?: string
          unread_count?: number
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wa_conversations_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "wa_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wa_conversations_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "wa_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wa_conversations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      wa_digest_config: {
        Row: {
          enabled: boolean
          last_sent_at: string | null
          period_hours: number
          schedule_time: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          enabled?: boolean
          last_sent_at?: string | null
          period_hours?: number
          schedule_time?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          enabled?: boolean
          last_sent_at?: string | null
          period_hours?: number
          schedule_time?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wa_digest_config_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      wa_instances: {
        Row: {
          created_at: string
          display_name: string
          evolution_instance_name: string
          id: string
          last_seen_at: string | null
          owner_user_id: string | null
          phone_number: string
          status: string
          updated_at: string
          webhook_secret: string
          webhook_token: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          display_name: string
          evolution_instance_name: string
          id?: string
          last_seen_at?: string | null
          owner_user_id?: string | null
          phone_number: string
          status?: string
          updated_at?: string
          webhook_secret?: string
          webhook_token?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          display_name?: string
          evolution_instance_name?: string
          id?: string
          last_seen_at?: string | null
          owner_user_id?: string | null
          phone_number?: string
          status?: string
          updated_at?: string
          webhook_secret?: string
          webhook_token?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wa_instances_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      wa_messages: {
        Row: {
          content_text: string | null
          content_type: string
          conversation_id: string
          direction: string
          evolution_message_id: string
          id: string
          intervention_user_id: string | null
          key_version: number
          media_mime: string | null
          media_size_bytes: number | null
          media_url: string | null
          metadata: Json | null
          received_at: string
          sent_by: string
          status: string | null
          timestamp_wa: string
          workspace_id: string
        }
        Insert: {
          content_text?: string | null
          content_type: string
          conversation_id: string
          direction: string
          evolution_message_id: string
          id?: string
          intervention_user_id?: string | null
          key_version?: number
          media_mime?: string | null
          media_size_bytes?: number | null
          media_url?: string | null
          metadata?: Json | null
          received_at?: string
          sent_by: string
          status?: string | null
          timestamp_wa: string
          workspace_id: string
        }
        Update: {
          content_text?: string | null
          content_type?: string
          conversation_id?: string
          direction?: string
          evolution_message_id?: string
          id?: string
          intervention_user_id?: string | null
          key_version?: number
          media_mime?: string | null
          media_size_bytes?: number | null
          media_url?: string | null
          metadata?: Json | null
          received_at?: string
          sent_by?: string
          status?: string | null
          timestamp_wa?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wa_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "wa_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wa_messages_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      wa_response_metrics: {
        Row: {
          avg_first_response_seconds: number | null
          avg_response_seconds: number | null
          conversations_started: number
          conversations_unanswered_1h: number
          date: string
          instance_id: string
          peak_hour: number | null
          total_in: number
          total_out: number
          unique_contacts: number
          updated_at: string
          workspace_id: string
        }
        Insert: {
          avg_first_response_seconds?: number | null
          avg_response_seconds?: number | null
          conversations_started?: number
          conversations_unanswered_1h?: number
          date: string
          instance_id: string
          peak_hour?: number | null
          total_in?: number
          total_out?: number
          unique_contacts?: number
          updated_at?: string
          workspace_id: string
        }
        Update: {
          avg_first_response_seconds?: number | null
          avg_response_seconds?: number | null
          conversations_started?: number
          conversations_unanswered_1h?: number
          date?: string
          instance_id?: string
          peak_hour?: number | null
          total_in?: number
          total_out?: number
          unique_contacts?: number
          updated_at?: string
          workspace_id?: string
        }
        Relationships: []
      }
      wa_webhook_queue: {
        Row: {
          attempts: number
          event_type: string
          id: number
          instance_id: string
          last_error: string | null
          next_attempt_at: string
          payload: Json
          processed_at: string | null
          received_at: string
          status: string
          workspace_id: string
        }
        Insert: {
          attempts?: number
          event_type: string
          id?: number
          instance_id: string
          last_error?: string | null
          next_attempt_at?: string
          payload: Json
          processed_at?: string | null
          received_at?: string
          status?: string
          workspace_id: string
        }
        Update: {
          attempts?: number
          event_type?: string
          id?: number
          instance_id?: string
          last_error?: string | null
          next_attempt_at?: string
          payload?: Json
          processed_at?: string | null
          received_at?: string
          status?: string
          workspace_id?: string
        }
        Relationships: []
      }
      workspace_invites: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          role: string
          token: string
          workspace_id: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          role?: string
          token?: string
          workspace_id: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          role?: string
          token?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_invites_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_members: {
        Row: {
          created_at: string
          id: string
          role: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string | null
          plan: string
          slug: string
          stripe_customer_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_id?: string | null
          plan?: string
          slug: string
          stripe_customer_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string | null
          plan?: string
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
      is_platform_admin: { Args: never; Returns: boolean }
      is_workspace_admin: { Args: { p_workspace_id: string }; Returns: boolean }
      is_workspace_member: {
        Args: { p_workspace_id: string }
        Returns: boolean
      }
      wa_aggregate_metrics: { Args: { p_date?: string }; Returns: undefined }
      wa_claim_digest_send: {
        Args: { p_workspace_id: string }
        Returns: boolean
      }
      wa_decrypt_content: {
        Args: {
          p_ciphertext: string
          p_key_version: number
          p_master_key: string
          p_workspace_id: string
        }
        Returns: string
      }
      wa_decrypt_content_rpc: {
        Args: {
          p_ciphertext: string
          p_key_version: number
          p_master_key: string
          p_workspace_id: string
        }
        Returns: string
      }
      wa_dequeue_webhook_items: {
        Args: { p_limit?: number }
        Returns: {
          attempts: number
          event_type: string
          id: number
          instance_id: string
          last_error: string | null
          next_attempt_at: string
          payload: Json
          processed_at: string | null
          received_at: string
          status: string
          workspace_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "wa_webhook_queue"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      wa_derive_workspace_key: {
        Args: {
          p_key_version: number
          p_master_key: string
          p_workspace_id: string
        }
        Returns: string
      }
      wa_due_digest_workspaces: {
        Args: { p_window_end: string; p_window_start: string }
        Returns: {
          period_hours: number
          workspace_id: string
        }[]
      }
      wa_encrypt_content: {
        Args: {
          p_key_version: number
          p_master_key: string
          p_plaintext: string
          p_workspace_id: string
        }
        Returns: string
      }
      wa_encrypt_content_rpc: {
        Args: {
          p_key_version: number
          p_master_key: string
          p_plaintext: string
          p_workspace_id: string
        }
        Returns: string
      }
      wa_get_conversation_messages_rpc: {
        Args: {
          p_before?: string
          p_conversation_id: string
          p_limit?: number
          p_master_key: string
          p_workspace_id: string
        }
        Returns: {
          content_text: string
          content_type: string
          direction: string
          id: string
          media_mime: string
          media_url: string
          sent_by: string
          status: string
          timestamp_wa: string
        }[]
      }
      wa_get_digest_config_rpc: {
        Args: { p_workspace_id: string }
        Returns: {
          enabled: boolean
          last_sent_at: string
          period_hours: number
          schedule_time: string
        }[]
      }
      wa_get_message_rpc: {
        Args: {
          p_master_key: string
          p_message_id: string
          p_workspace_id: string
        }
        Returns: {
          content_text: string
          content_type: string
          conversation_id: string
          direction: string
          id: string
          media_mime: string
          media_url: string
          sent_by: string
          status: string
          timestamp_wa: string
        }[]
      }
      wa_get_metrics_overview_rpc: {
        Args: { p_from: string; p_to: string; p_workspace_id: string }
        Returns: {
          avg_first_response_seconds: number
          conversations_started: number
          conversations_unanswered_1h: number
          date: string
          total_in: number
          total_out: number
          unique_contacts: number
        }[]
      }
      wa_list_conversations_rpc: {
        Args: {
          p_instance_id?: string
          p_limit?: number
          p_offset?: number
          p_search?: string
          p_status?: string
          p_workspace_id: string
        }
        Returns: {
          contact_id: string
          contact_name: string
          contact_phone: string
          id: string
          instance_id: string
          last_message_at: string
          last_message_preview: string
          status: string
          unread_count: number
        }[]
      }
      wa_upsert_digest_config_rpc: {
        Args: {
          p_enabled: boolean
          p_period_hours: number
          p_schedule_time: string
          p_workspace_id: string
        }
        Returns: undefined
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
