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
      denuncias: {
        Row: {
          contato_opcional: string | null
          created_at: string
          data_ocorrido: string | null
          descricao: string
          id: string
          notas_internas: string | null
          policial_denunciado: string | null
          status: Database["public"]["Enums"]["denuncia_status"]
          numero_registro: number
          titulo: string
          dados_detalhados: Json | null
          updated_at: string
        }
        Insert: {
          contato_opcional?: string | null
          created_at?: string
          data_ocorrido?: string | null
          descricao: string
          id?: string
          notas_internas?: string | null
          policial_denunciado?: string | null
          status?: Database["public"]["Enums"]["denuncia_status"]
          titulo: string
          dados_detalhados?: Json | null
          updated_at?: string
        }
        Update: {
          contato_opcional?: string | null
          created_at?: string
          data_ocorrido?: string | null
          descricao?: string
          id?: string
          notas_internas?: string | null
          policial_denunciado?: string | null
          status?: Database["public"]["Enums"]["denuncia_status"]
          titulo?: string
          dados_detalhados?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          badge_number: string | null
          created_at: string
          full_name: string
          patente: string | null
          id: string
        }
        Insert: {
          badge_number?: string | null
          created_at?: string
          full_name: string
          patente?: string | null
          id: string
        }
        Update: {
          badge_number?: string | null
          created_at?: string
          full_name?: string
          patente?: string | null
          id?: string
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
          role: Database["public"]["Enums"]["app_role"]
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
      investigacoes: {
        Row: {
          id: string
          numero_registro: number
          titulo: string
          descricao: string | null
          investigado: string | null
          status: Database["public"]["Enums"]["denuncia_status"]
          notas_internas: string | null
          tipo_procedimento: string | null
          autoridade_responsavel: string | null
          autoridade_patente: string | null
          autoridade_departamento: string | null
          investigado_badge: string | null
          investigado_patente: string | null
          investigado_unidade: string | null
          origem_caso: string | null
          origem_outro: string | null
          fundamentacao: string | null
          medidas_iniciais: Json | null
          medidas_outro: string | null
          detalhes_adicionais: string | null
          created_at: string
        }
        Insert: any
        Update: any
        Relationships: []
      }
      relatorios: {
        Row: {
          id: string
          numero_registro: number
          titulo: string
          tipo_denuncia: string
          oficial: string
          conteudo: string
          status: Database["public"]["Enums"]["denuncia_status"]
          dados_detalhados: Json | null
          created_at: string
        }
        Insert: any
        Update: any
        Relationships: []
      }
      denuncia_relatorio: {
        Row: { denuncia_id: string; relatorio_id: string }
        Insert: any; Update: any; Relationships: []
      }
      investigacao_relatorio: {
        Row: { investigacao_id: string; relatorio_id: string }
        Insert: any; Update: any; Relationships: []
      }
      denuncia_investigacao: {
        Row: { denuncia_id: string; investigacao_id: string }
        Insert: any; Update: any; Relationships: []
      }
      depoimentos: {
        Row: {
          id: string
          numero_registro: number
          oficial_nome: string
          oficial_patente: string | null
          oficial_re: string | null
          depoimento: string
          data_depoimento: string
          oficial_batalhao: string | null
          relatorio_id_ip: string | null
          relatorio_id_ato: string | null
          investigacao_id: string | null
          observacao: string | null
          created_at: string
        }
        Insert: any; Update: any; Relationships: []
      }
      denuncia_depoimento: {
        Row: { denuncia_id: string; depoimento_id: string }
        Insert: any; Update: any; Relationships: []
      }
      relatorio_geral_vinculos: {
        Row: {
          id: string
          relatorio_id: string
          entidade_id: string
          entidade_tipo: string
          created_at: string
        }
        Insert: any; Update: any; Relationships: []
      }
      ipm: {
        Row: {
          id: string
          numero_ipm: string
          data_instauracao: string
          unidade: string
          status: string
          encarregado_nome: string
          encarregado_posto: string
          autoridade_nome: string
          autoridade_posto: string
          fundamentacao: string
          artigos_cpm: string
          artigos_rdpm: string
          relatorio_fatos: string
          conclusao_parcial: string
          indiciados: Json
          enquadramentos: Json
          vinculacoes: Json
          historico_versoes: Json
          autor_id: string | null
          autor_nome: string | null
          created_at: string
          updated_at: string
        }
        Insert: any; Update: any; Relationships: []
      }
      ipm_vinculos: {
        Row: {
          id: string
          ipm_id: string
          entidade_id: string
          entidade_tipo: string
          created_at: string
        }
        Insert: any; Update: any; Relationships: []
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string
          user_name: string
          action: string
          entity_type: string
          entity_id: string
          details: Json
          created_at: string
        }
        Insert: any; Update: any; Relationships: []
      }
      afastamentos: {
        Row: {
          id: string
          numero_portaria: string
          data_emissao: string
          posto_graduacao: string
          nome_completo: string
          rg_pm: string
          unidade: string
          data_inicio: string
          data_termino: string
          observacoes: string | null
          inquerito_id: string | null
          responsavel_nome: string
          responsavel_posto: string
          responsavel_assinatura: string | null
          motivo_afastamento: string
          status: string
          autor_id: string | null
          autor_nome: string | null
          historico_versoes: Json
          created_at: string
          updated_at: string
        }
        Insert: any; Update: any; Relationships: []
      }
      investigacoes_policial: {
        Row: {
          id: string
          numero_investigacao: string
          data_instauracao: string
          encarregado: string
          descricao_fatos: string
          provas_anexadas: string | null
          testemunhas: string | null
          status: string
          afastamento_id: string
          created_at: string
          updated_at: string
        }
        Insert: any; Update: any; Relationships: []
      }
      inqueritos_policial: {
        Row: {
          id: string
          numero_inquerito: string
          data_instauracao: string
          autoridade_responsavel: string
          relatorio: string | null
          parecer: string | null
          resultado: string | null
          status: string
          afastamento_id: string
          created_at: string
          updated_at: string
        }
        Insert: any; Update: any; Relationships: []
      }
      advertencias: {
        Row: {
          id: string
          descricao: string
          data_advertencia: string
          autoridade_responsavel: string
          afastamento_id: string
          created_at: string
        }
        Insert: any; Update: any; Relationships: []
      }
      afastamento_denuncia: {
        Row: { afastamento_id: string; denuncia_id: string; created_at: string }
        Insert: any; Update: any; Relationships: []
      }
      afastamento_investigacao: {
        Row: { afastamento_id: string; investigacao_id: string; created_at: string }
        Insert: any; Update: any; Relationships: []
      }
      afastamento_relatorio: {
        Row: { afastamento_id: string; relatorio_id: string; created_at: string }
        Insert: any; Update: any; Relationships: []
      }
      afastamento_depoimento: {
        Row: { afastamento_id: string; depoimento_id: string; created_at: string }
        Insert: any; Update: any; Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "corregedor" | "pending"
      denuncia_status: "pendente" | "em_analise" | "concluida" | "arquivada"
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
      app_role: ["admin", "corregedor", "pending"],
      denuncia_status: ["pendente", "em_analise", "concluida", "arquivada"],
    },
  },
} as const
