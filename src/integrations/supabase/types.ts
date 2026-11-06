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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      account_connection_secrets: {
        Row: {
          account_id: string
          api_token: string | null
          created_at: string
          investor_password: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id: string
          api_token?: string | null
          created_at?: string
          investor_password?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string
          api_token?: string | null
          created_at?: string
          investor_password?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_connection_secrets_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: true
            referencedRelation: "trading_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_bias_reports: {
        Row: {
          generated_at: string | null
          lease_until: string
          paused_reason: string | null
          paused_status: number | null
          report: Json | null
          user_id: string
        }
        Insert: {
          generated_at?: string | null
          lease_until?: string
          paused_reason?: string | null
          paused_status?: number | null
          report?: Json | null
          user_id: string
        }
        Update: {
          generated_at?: string | null
          lease_until?: string
          paused_reason?: string | null
          paused_status?: number | null
          report?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      backtests: {
        Row: {
          created_at: string
          data_mode: string
          drawings: Json
          id: string
          name: string
          notes: string
          replay_index: number
          settings: Json
          stats: Json
          symbol: string
          timeframe: string
          trades: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data_mode?: string
          drawings?: Json
          id?: string
          name?: string
          notes?: string
          replay_index?: number
          settings?: Json
          stats?: Json
          symbol: string
          timeframe: string
          trades?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data_mode?: string
          drawings?: Json
          id?: string
          name?: string
          notes?: string
          replay_index?: number
          settings?: Json
          stats?: Json
          symbol?: string
          timeframe?: string
          trades?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      journal_trades: {
        Row: {
          account_id: string | null
          created_at: string
          direction: string
          entry_price: number | null
          entry_reason: string | null
          fundamental: string | null
          id: string
          instrument: string
          lot_size: number | null
          pnl: number | null
          psychology: string | null
          risk_pct: number | null
          rr: number | null
          rules_broken: string | null
          rules_followed: boolean
          screenshot_url: string | null
          sd_zone: string | null
          seasonality: string | null
          stop_loss: number | null
          take_profit: number | null
          timeframe: string | null
          traded_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          created_at?: string
          direction?: string
          entry_price?: number | null
          entry_reason?: string | null
          fundamental?: string | null
          id?: string
          instrument: string
          lot_size?: number | null
          pnl?: number | null
          psychology?: string | null
          risk_pct?: number | null
          rr?: number | null
          rules_broken?: string | null
          rules_followed?: boolean
          screenshot_url?: string | null
          sd_zone?: string | null
          seasonality?: string | null
          stop_loss?: number | null
          take_profit?: number | null
          timeframe?: string | null
          traded_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          created_at?: string
          direction?: string
          entry_price?: number | null
          entry_reason?: string | null
          fundamental?: string | null
          id?: string
          instrument?: string
          lot_size?: number | null
          pnl?: number | null
          psychology?: string | null
          risk_pct?: number | null
          rr?: number | null
          rules_broken?: string | null
          rules_followed?: boolean
          screenshot_url?: string | null
          sd_zone?: string | null
          seasonality?: string | null
          stop_loss?: number | null
          take_profit?: number | null
          timeframe?: string | null
          traded_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_trades_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "trading_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      trading_accounts: {
        Row: {
          account_login: string | null
          balance: number
          connection_error: string | null
          connection_status: Database["public"]["Enums"]["account_connection_status"]
          created_at: string
          currency: string
          current_dd_pct: number
          equity: number | null
          id: string
          last_sync_at: string | null
          max_dd_pct: number
          name: string
          notes: string | null
          phase: string
          platform: Database["public"]["Enums"]["trading_platform"]
          profit_target_pct: number
          prop_firm: string | null
          server: string | null
          start_balance: number
          updated_at: string
          user_id: string
        }
        Insert: {
          account_login?: string | null
          balance?: number
          connection_error?: string | null
          connection_status?: Database["public"]["Enums"]["account_connection_status"]
          created_at?: string
          currency?: string
          current_dd_pct?: number
          equity?: number | null
          id?: string
          last_sync_at?: string | null
          max_dd_pct?: number
          name: string
          notes?: string | null
          phase?: string
          platform?: Database["public"]["Enums"]["trading_platform"]
          profit_target_pct?: number
          prop_firm?: string | null
          server?: string | null
          start_balance?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          account_login?: string | null
          balance?: number
          connection_error?: string | null
          connection_status?: Database["public"]["Enums"]["account_connection_status"]
          created_at?: string
          currency?: string
          current_dd_pct?: number
          equity?: number | null
          id?: string
          last_sync_at?: string | null
          max_dd_pct?: number
          name?: string
          notes?: string | null
          phase?: string
          platform?: Database["public"]["Enums"]["trading_platform"]
          profit_target_pct?: number
          prop_firm?: string | null
          server?: string | null
          start_balance?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_ai_bias: { Args: never; Returns: boolean }
    }
    Enums: {
      account_connection_status: "manual" | "pending" | "connected" | "error"
      trading_platform:
        | "mt4"
        | "mt5"
        | "ctrader"
        | "tradovate"
        | "tradelocker"
        | "other"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      account_connection_status: ["manual", "pending", "connected", "error"],
      trading_platform: [
        "mt4",
        "mt5",
        "ctrader",
        "tradovate",
        "tradelocker",
        "other",
      ],
    },
  },
} as const
