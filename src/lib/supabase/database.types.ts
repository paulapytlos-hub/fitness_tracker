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
      exercise_sets: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          reps: number | null
          rpe: number | null
          session_exercise_id: string
          set_number: number
          weight: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          reps?: number | null
          rpe?: number | null
          session_exercise_id: string
          set_number: number
          weight?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          reps?: number | null
          rpe?: number | null
          session_exercise_id?: string
          set_number?: number
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "exercise_sets_session_exercise_id_fkey"
            columns: ["session_exercise_id"]
            isOneToOne: false
            referencedRelation: "session_exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          created_at: string
          day_of_week: number | null
          id: string
          name: string
          notes: string | null
          plan_id: string
          position: number
          rep_range: string | null
          sets: number | null
          target_rpe: number | null
          target_weight: number | null
        }
        Insert: {
          created_at?: string
          day_of_week?: number | null
          id?: string
          name: string
          notes?: string | null
          plan_id: string
          position?: number
          rep_range?: string | null
          sets?: number | null
          target_rpe?: number | null
          target_weight?: number | null
        }
        Update: {
          created_at?: string
          day_of_week?: number | null
          id?: string
          name?: string
          notes?: string | null
          plan_id?: string
          position?: number
          rep_range?: string | null
          sets?: number | null
          target_rpe?: number | null
          target_weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "exercises_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "workout_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          completed: boolean
          created_at: string
          current_value: number
          deadline: string | null
          description: string | null
          goal_type: string
          id: string
          name: string
          target_value: number | null
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          current_value?: number
          deadline?: string | null
          description?: string | null
          goal_type: string
          id?: string
          name: string
          target_value?: number | null
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          current_value?: number
          deadline?: string | null
          description?: string | null
          goal_type?: string
          id?: string
          name?: string
          target_value?: number | null
          user_id?: string
        }
        Relationships: []
      }
      plan_days: {
        Row: {
          created_at: string
          day_of_week: number
          id: string
          name: string
          plan_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          id?: string
          name: string
          plan_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          id?: string
          name?: string
          plan_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_days_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "workout_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          name?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
        }
        Relationships: []
      }
      progress_photos: {
        Row: {
          created_at: string
          id: string
          photo_type: string
          storage_path: string
          user_id: string
          weekly_report_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          photo_type: string
          storage_path: string
          user_id: string
          weekly_report_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          photo_type?: string
          storage_path?: string
          user_id?: string
          weekly_report_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "progress_photos_weekly_report_id_fkey"
            columns: ["weekly_report_id"]
            isOneToOne: false
            referencedRelation: "weekly_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_workouts: {
        Row: {
          created_at: string
          id: string
          plan_id: string
          scheduled_date: string
          source_day_of_week: number | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          plan_id: string
          scheduled_date: string
          source_day_of_week?: number | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          plan_id?: string
          scheduled_date?: string
          source_day_of_week?: number | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_workouts_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "workout_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      session_exercises: {
        Row: {
          created_at: string
          id: string
          name: string
          notes: string | null
          position: number
          session_id: string
          source_exercise_id: string | null
          target_rep_range: string | null
          target_rpe: number | null
          target_sets: number | null
          target_weight: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          position?: number
          session_id: string
          source_exercise_id?: string | null
          target_rep_range?: string | null
          target_rpe?: number | null
          target_sets?: number | null
          target_weight?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          position?: number
          session_id?: string
          source_exercise_id?: string | null
          target_rep_range?: string | null
          target_rpe?: number | null
          target_sets?: number | null
          target_weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "session_exercises_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_exercises_source_exercise_id_fkey"
            columns: ["source_exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_reports: {
        Row: {
          created_at: string
          hips: number | null
          id: string
          mood: string | null
          notes: string | null
          thigh: number | null
          user_id: string
          waist: number | null
          week_start: string
          weight: number | null
        }
        Insert: {
          created_at?: string
          hips?: number | null
          id?: string
          mood?: string | null
          notes?: string | null
          thigh?: number | null
          user_id: string
          waist?: number | null
          week_start: string
          weight?: number | null
        }
        Update: {
          created_at?: string
          hips?: number | null
          id?: string
          mood?: string | null
          notes?: string | null
          thigh?: number | null
          user_id?: string
          waist?: number | null
          week_start?: string
          weight?: number | null
        }
        Relationships: []
      }
      workout_plans: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      workout_sessions: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          notes: string | null
          plan_id: string | null
          scheduled_date: string | null
          started_at: string
          title: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          plan_id?: string | null
          scheduled_date?: string | null
          started_at?: string
          title?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          plan_id?: string | null
          scheduled_date?: string | null
          started_at?: string
          title?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_sessions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "workout_plans"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
