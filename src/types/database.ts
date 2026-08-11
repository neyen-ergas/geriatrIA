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
      admissions: {
        Row: {
          administrative_notes: string | null
          admitted_at: string
          created_at: string
          currency: string
          discharge_reason: string | null
          discharged_at: string | null
          due_day: number
          id: string
          monthly_fee: number
          resident_id: string
          room: string | null
          updated_at: string
        }
        Insert: {
          administrative_notes?: string | null
          admitted_at: string
          created_at?: string
          currency?: string
          discharge_reason?: string | null
          discharged_at?: string | null
          due_day: number
          id?: string
          monthly_fee: number
          resident_id: string
          room?: string | null
          updated_at?: string
        }
        Update: {
          administrative_notes?: string | null
          admitted_at?: string
          created_at?: string
          currency?: string
          discharge_reason?: string | null
          discharged_at?: string | null
          due_day?: number
          id?: string
          monthly_fee?: number
          resident_id?: string
          room?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admissions_resident_id_fkey"
            columns: ["resident_id"]
            isOneToOne: false
            referencedRelation: "residents"
            referencedColumns: ["id"]
          },
        ]
      }
      consulta: {
        Row: {
          actualizado_en: string
          creado_en: string
          estado: string
          id: string
          mensaje: string | null
          momento_llamado: string
          nombre: string
          notas_internas: string | null
          origen: string
          telefono: string
          visita_fecha: string | null
          visita_franja: string | null
        }
        Insert: {
          actualizado_en?: string
          creado_en?: string
          estado?: string
          id?: string
          mensaje?: string | null
          momento_llamado?: string
          nombre: string
          notas_internas?: string | null
          origen?: string
          telefono: string
          visita_fecha?: string | null
          visita_franja?: string | null
        }
        Update: {
          actualizado_en?: string
          creado_en?: string
          estado?: string
          id?: string
          mensaje?: string | null
          momento_llamado?: string
          nombre?: string
          notas_internas?: string | null
          origen?: string
          telefono?: string
          visita_fecha?: string | null
          visita_franja?: string | null
        }
        Relationships: []
      }
      family_contacts: {
        Row: {
          created_at: string
          first_name: string
          id: string
          is_emergency_contact: boolean
          is_payment_responsible: boolean
          last_name: string
          notes: string | null
          phone: string
          relationship: string
          resident_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          first_name: string
          id?: string
          is_emergency_contact?: boolean
          is_payment_responsible?: boolean
          last_name: string
          notes?: string | null
          phone: string
          relationship: string
          resident_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          first_name?: string
          id?: string
          is_emergency_contact?: boolean
          is_payment_responsible?: boolean
          last_name?: string
          notes?: string | null
          phone?: string
          relationship?: string
          resident_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_contacts_resident_id_fkey"
            columns: ["resident_id"]
            isOneToOne: false
            referencedRelation: "residents"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_charges: {
        Row: {
          admission_id: string
          amount_due: number
          cancelled_at: string | null
          cancelled_by: string | null
          cancelled_reason: string | null
          created_at: string
          created_by: string
          currency: string
          due_date: string
          id: string
          notes: string | null
          period: string
        }
        Insert: {
          admission_id: string
          amount_due: number
          cancelled_at?: string | null
          cancelled_by?: string | null
          cancelled_reason?: string | null
          created_at?: string
          created_by?: string
          currency?: string
          due_date: string
          id?: string
          notes?: string | null
          period: string
        }
        Update: {
          admission_id?: string
          amount_due?: number
          cancelled_at?: string | null
          cancelled_by?: string | null
          cancelled_reason?: string | null
          created_at?: string
          created_by?: string
          currency?: string
          due_date?: string
          id?: string
          notes?: string | null
          period?: string
        }
        Relationships: [
          {
            foreignKeyName: "monthly_charges_admission_id_fkey"
            columns: ["admission_id"]
            isOneToOne: false
            referencedRelation: "admissions"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          created_by: string
          id: string
          monthly_charge_id: string
          notes: string | null
          paid_on: string
          payment_method: string
          receipt_path: string | null
          reference: string | null
          voided_at: string | null
          voided_by: string | null
          voided_reason: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string
          id?: string
          monthly_charge_id: string
          notes?: string | null
          paid_on: string
          payment_method: string
          receipt_path?: string | null
          reference?: string | null
          voided_at?: string | null
          voided_by?: string | null
          voided_reason?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string
          id?: string
          monthly_charge_id?: string
          notes?: string | null
          paid_on?: string
          payment_method?: string
          receipt_path?: string | null
          reference?: string | null
          voided_at?: string | null
          voided_by?: string | null
          voided_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_monthly_charge_id_fkey"
            columns: ["monthly_charge_id"]
            isOneToOne: false
            referencedRelation: "monthly_charge_balances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_monthly_charge_id_fkey"
            columns: ["monthly_charge_id"]
            isOneToOne: false
            referencedRelation: "monthly_charges"
            referencedColumns: ["id"]
          },
        ]
      }
      residents: {
        Row: {
          address: string | null
          birth_date: string
          created_at: string
          dni: string
          first_name: string
          id: string
          last_name: string
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          birth_date: string
          created_at?: string
          dni: string
          first_name: string
          id?: string
          last_name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          birth_date?: string
          created_at?: string
          dni?: string
          first_name?: string
          id?: string
          last_name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      monthly_charge_balances: {
        Row: {
          admission_id: string | null
          amount_due: number | null
          balance: number | null
          cancelled_at: string | null
          cancelled_by: string | null
          cancelled_reason: string | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          due_date: string | null
          id: string | null
          is_overdue: boolean | null
          notes: string | null
          paid_amount: number | null
          payment_status: string | null
          period: string | null
        }
        Relationships: [
          {
            foreignKeyName: "monthly_charges_admission_id_fkey"
            columns: ["admission_id"]
            isOneToOne: false
            referencedRelation: "admissions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      cancel_monthly_charge: {
        Args: { p_monthly_charge_id: string; p_reason: string }
        Returns: string
      }
      create_initial_admission: {
        Args: {
          p_administrative_notes?: string
          p_admitted_at: string
          p_contact_first_name: string
          p_contact_is_emergency_contact: boolean
          p_contact_is_payment_responsible: boolean
          p_contact_last_name: string
          p_contact_notes?: string
          p_contact_phone: string
          p_contact_relationship: string
          p_due_day: number
          p_monthly_fee: number
          p_resident_address?: string
          p_resident_birth_date: string
          p_resident_dni: string
          p_resident_first_name: string
          p_resident_last_name: string
          p_resident_notes?: string
          p_resident_phone?: string
          p_room?: string
        }
        Returns: string
      }
      create_monthly_charge: {
        Args: {
          p_admission_id: string
          p_amount_due: number
          p_due_date: string
          p_notes?: string
          p_period: string
        }
        Returns: string
      }
      record_payment: {
        Args: {
          p_amount: number
          p_monthly_charge_id: string
          p_notes?: string
          p_paid_on: string
          p_payment_method: string
          p_receipt_path?: string
          p_reference?: string
        }
        Returns: string
      }
      update_active_admission: {
        Args: {
          p_administrative_notes?: string
          p_admission_id: string
          p_admitted_at: string
          p_contact_first_name: string
          p_contact_id: string
          p_contact_is_emergency_contact: boolean
          p_contact_is_payment_responsible: boolean
          p_contact_last_name: string
          p_contact_notes?: string
          p_contact_phone: string
          p_contact_relationship: string
          p_due_day: number
          p_monthly_fee: number
          p_resident_address?: string
          p_resident_birth_date: string
          p_resident_dni: string
          p_resident_first_name: string
          p_resident_id: string
          p_resident_last_name: string
          p_resident_notes?: string
          p_resident_phone?: string
          p_room?: string
        }
        Returns: string
      }
      void_payment: {
        Args: { p_payment_id: string; p_reason: string }
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
