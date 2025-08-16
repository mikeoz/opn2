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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          id: string
          ip_address: unknown | null
          new_values: Json | null
          old_values: Json | null
          operation: string
          record_id: string | null
          table_name: string
          timestamp: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          operation: string
          record_id?: string | null
          table_name: string
          timestamp?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          operation?: string
          record_id?: string | null
          table_name?: string
          timestamp?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      bulk_import_jobs: {
        Row: {
          created_at: string
          created_by: string
          error_details: Json | null
          failed_rows: number | null
          file_path: string | null
          id: string
          job_name: string
          organization_id: string | null
          processed_rows: number | null
          status: string
          template_selection: Json
          total_rows: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          error_details?: Json | null
          failed_rows?: number | null
          file_path?: string | null
          id?: string
          job_name: string
          organization_id?: string | null
          processed_rows?: number | null
          status?: string
          template_selection: Json
          total_rows?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          error_details?: Json | null
          failed_rows?: number | null
          file_path?: string | null
          id?: string
          job_name?: string
          organization_id?: string | null
          processed_rows?: number | null
          status?: string
          template_selection?: Json
          total_rows?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bulk_import_jobs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      card_categories: {
        Row: {
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      card_field_values: {
        Row: {
          created_at: string
          id: string
          template_field_id: string
          updated_at: string
          user_card_id: string
          value: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          template_field_id: string
          updated_at?: string
          user_card_id: string
          value?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          template_field_id?: string
          updated_at?: string
          user_card_id?: string
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "card_field_values_template_field_id_fkey"
            columns: ["template_field_id"]
            isOneToOne: false
            referencedRelation: "template_fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_field_values_user_card_id_fkey"
            columns: ["user_card_id"]
            isOneToOne: false
            referencedRelation: "user_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      card_invitations: {
        Row: {
          accepted_at: string | null
          bulk_import_job_id: string
          card_id: string | null
          created_at: string
          expires_at: string | null
          id: string
          invitation_data: Json | null
          invitation_token: string | null
          recipient_email: string
          recipient_name: string | null
          sent_at: string | null
          status: string
        }
        Insert: {
          accepted_at?: string | null
          bulk_import_job_id: string
          card_id?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          invitation_data?: Json | null
          invitation_token?: string | null
          recipient_email: string
          recipient_name?: string | null
          sent_at?: string | null
          status?: string
        }
        Update: {
          accepted_at?: string | null
          bulk_import_job_id?: string
          card_id?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          invitation_data?: Json | null
          invitation_token?: string | null
          recipient_email?: string
          recipient_name?: string | null
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_invitations_bulk_import_job_id_fkey"
            columns: ["bulk_import_job_id"]
            isOneToOne: false
            referencedRelation: "bulk_import_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_invitations_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "user_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      card_labels: {
        Row: {
          created_at: string
          id: string
          label: string
          updated_at: string
          user_card_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          updated_at?: string
          user_card_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          updated_at?: string
          user_card_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_labels_user_card_id_fkey"
            columns: ["user_card_id"]
            isOneToOne: false
            referencedRelation: "user_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      card_relationships: {
        Row: {
          card_id: string
          created_by: string
          expires_at: string | null
          id: string
          permissions: Json | null
          relationship_type: string
          shared_at: string
          shared_with_provider_id: string | null
          shared_with_user_id: string | null
        }
        Insert: {
          card_id: string
          created_by: string
          expires_at?: string | null
          id?: string
          permissions?: Json | null
          relationship_type: string
          shared_at?: string
          shared_with_provider_id?: string | null
          shared_with_user_id?: string | null
        }
        Update: {
          card_id?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          permissions?: Json | null
          relationship_type?: string
          shared_at?: string
          shared_with_provider_id?: string | null
          shared_with_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "card_relationships_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "user_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      card_templates: {
        Row: {
          card_type: Database["public"]["Enums"]["card_type"]
          category_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          transaction_code: Database["public"]["Enums"]["transaction_code"]
          type: Database["public"]["Enums"]["card_type"]
          updated_at: string
        }
        Insert: {
          card_type?: Database["public"]["Enums"]["card_type"]
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          transaction_code?: Database["public"]["Enums"]["transaction_code"]
          type?: Database["public"]["Enums"]["card_type"]
          updated_at?: string
        }
        Update: {
          card_type?: Database["public"]["Enums"]["card_type"]
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          transaction_code?: Database["public"]["Enums"]["transaction_code"]
          type?: Database["public"]["Enums"]["card_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_templates_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "card_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_memberships: {
        Row: {
          created_at: string | null
          created_by: string | null
          expires_at: string | null
          id: string
          individual_user_id: string
          joined_at: string | null
          membership_type: string
          organization_user_id: string
          permissions: Json | null
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          individual_user_id: string
          joined_at?: string | null
          membership_type?: string
          organization_user_id: string
          permissions?: Json | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          individual_user_id?: string
          joined_at?: string | null
          membership_type?: string
          organization_user_id?: string
          permissions?: Json | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_memberships_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_memberships_individual_user_id_fkey"
            columns: ["individual_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_memberships_organization_user_id_fkey"
            columns: ["organization_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_type: Database["public"]["Enums"]["account_type"]
          avatar_url: string | null
          created_at: string
          email: string | null
          first_name: string | null
          guid: string
          id: string
          last_name: string | null
          organization_name: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          account_type: Database["public"]["Enums"]["account_type"]
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          guid: string
          id: string
          last_name?: string | null
          organization_name?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          account_type?: Database["public"]["Enums"]["account_type"]
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          guid?: string
          id?: string
          last_name?: string | null
          organization_name?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      providers: {
        Row: {
          capabilities: Json | null
          contact_info: Json | null
          created_at: string
          description: string | null
          id: string
          name: string
          provider_type: string
          standards: Json | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          capabilities?: Json | null
          contact_info?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          provider_type: string
          standards?: Json | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          capabilities?: Json | null
          contact_info?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          provider_type?: string
          standards?: Json | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "providers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      relationship_interactions: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          interaction_data: Json | null
          interaction_type: string
          relationship_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          interaction_data?: Json | null
          interaction_type: string
          relationship_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          interaction_data?: Json | null
          interaction_type?: string
          relationship_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "relationship_interactions_relationship_id_fkey"
            columns: ["relationship_id"]
            isOneToOne: false
            referencedRelation: "user_provider_relationships"
            referencedColumns: ["id"]
          },
        ]
      }
      sharing_templates: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_public: boolean | null
          name: string
          template_permissions: Json
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          name: string
          template_permissions?: Json
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          template_permissions?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      standard_card_templates: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          template_data: Json
          updated_at: string
          version: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          template_data: Json
          updated_at?: string
          version?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          template_data?: Json
          updated_at?: string
          version?: string
        }
        Relationships: []
      }
      template_fields: {
        Row: {
          created_at: string
          display_order: number
          field_name: string
          field_type: Database["public"]["Enums"]["field_type"]
          id: string
          is_required: boolean
          template_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          field_name: string
          field_type: Database["public"]["Enums"]["field_type"]
          id?: string
          is_required?: boolean
          template_id: string
        }
        Update: {
          created_at?: string
          display_order?: number
          field_name?: string
          field_type?: Database["public"]["Enums"]["field_type"]
          id?: string
          is_required?: boolean
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_fields_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "card_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      user_cards: {
        Row: {
          card_code: string
          created_at: string
          id: string
          template_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          card_code: string
          created_at?: string
          id?: string
          template_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          card_code?: string
          created_at?: string
          id?: string
          template_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_cards_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "card_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      user_provider_relationships: {
        Row: {
          access_permissions: Json | null
          created_at: string
          id: string
          provider_id: string
          relationship_type: string
          status: string
          transaction_controls: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_permissions?: Json | null
          created_at?: string
          id?: string
          provider_id: string
          relationship_type?: string
          status?: string
          transaction_controls?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_permissions?: Json | null
          created_at?: string
          id?: string
          provider_id?: string
          relationship_type?: string
          status?: string
          transaction_controls?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      assign_admin_role: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      generate_card_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_guid: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      revoke_admin_role: {
        Args: { target_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      access_permission_type:
        | "view_basic"
        | "view_detailed"
        | "edit"
        | "share"
        | "delete"
        | "admin"
      account_type: "individual" | "non_individual"
      app_role: "admin" | "user"
      card_type: "admin" | "user" | "access" | "participant" | "transaction"
      field_type: "string" | "image" | "document"
      transaction_code: "S" | "N"
      transaction_control_type: "read" | "write" | "share" | "delete" | "admin"
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
    Enums: {
      access_permission_type: [
        "view_basic",
        "view_detailed",
        "edit",
        "share",
        "delete",
        "admin",
      ],
      account_type: ["individual", "non_individual"],
      app_role: ["admin", "user"],
      card_type: ["admin", "user", "access", "participant", "transaction"],
      field_type: ["string", "image", "document"],
      transaction_code: ["S", "N"],
      transaction_control_type: ["read", "write", "share", "delete", "admin"],
    },
  },
} as const
