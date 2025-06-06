export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
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
      card_templates: {
        Row: {
          card_type: Database["public"]["Enums"]["card_type"]
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
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          transaction_code?: Database["public"]["Enums"]["transaction_code"]
          type?: Database["public"]["Enums"]["card_type"]
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_type: Database["public"]["Enums"]["account_type"]
          created_at: string
          email: string | null
          entity_name: string | null
          first_name: string | null
          guid: string
          id: string
          last_name: string | null
          rep_email: string | null
          rep_first_name: string | null
          rep_last_name: string | null
          updated_at: string
        }
        Insert: {
          account_type: Database["public"]["Enums"]["account_type"]
          created_at?: string
          email?: string | null
          entity_name?: string | null
          first_name?: string | null
          guid: string
          id: string
          last_name?: string | null
          rep_email?: string | null
          rep_first_name?: string | null
          rep_last_name?: string | null
          updated_at?: string
        }
        Update: {
          account_type?: Database["public"]["Enums"]["account_type"]
          created_at?: string
          email?: string | null
          entity_name?: string | null
          first_name?: string | null
          guid?: string
          id?: string
          last_name?: string | null
          rep_email?: string | null
          rep_first_name?: string | null
          rep_last_name?: string | null
          updated_at?: string
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
        Relationships: [
          {
            foreignKeyName: "user_provider_relationships_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
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
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
    }
    Enums: {
      account_type: "individual" | "non_individual"
      app_role: "admin" | "user"
      card_type: "admin" | "user" | "access" | "participant" | "transaction"
      field_type: "string" | "image" | "document"
      transaction_code: "S" | "N"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      account_type: ["individual", "non_individual"],
      app_role: ["admin", "user"],
      card_type: ["admin", "user", "access", "participant", "transaction"],
      field_type: ["string", "image", "document"],
      transaction_code: ["S", "N"],
    },
  },
} as const
