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
      assinantes: {
        Row: {
          ativo: boolean | null
          confirmado: boolean | null
          created_at: string | null
          eh_piloto: boolean | null
          email: string
          id: string
          nome: string
          token_confirmacao: string | null
          token_descadastro: string | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          confirmado?: boolean | null
          created_at?: string | null
          eh_piloto?: boolean | null
          email: string
          id?: string
          nome: string
          token_confirmacao?: string | null
          token_descadastro?: string | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          confirmado?: boolean | null
          created_at?: string | null
          eh_piloto?: boolean | null
          email?: string
          id?: string
          nome?: string
          token_confirmacao?: string | null
          token_descadastro?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      boletins: {
        Row: {
          audio_url: string | null
          bandeira: Database["public"]["Enums"]["bandeira_tipo"]
          created_at: string | null
          data: string
          fotos: string[] | null
          id: string
          motivo: string
          periodo: Database["public"]["Enums"]["periodo_tipo"]
          publicado: boolean | null
          publicado_em: string | null
          publicado_por: string | null
          status_voo: Database["public"]["Enums"]["status_voo"]
          titulo_curto: string
          updated_at: string | null
        }
        Insert: {
          audio_url?: string | null
          bandeira: Database["public"]["Enums"]["bandeira_tipo"]
          created_at?: string | null
          data: string
          fotos?: string[] | null
          id?: string
          motivo: string
          periodo: Database["public"]["Enums"]["periodo_tipo"]
          publicado?: boolean | null
          publicado_em?: string | null
          publicado_por?: string | null
          status_voo: Database["public"]["Enums"]["status_voo"]
          titulo_curto: string
          updated_at?: string | null
        }
        Update: {
          audio_url?: string | null
          bandeira?: Database["public"]["Enums"]["bandeira_tipo"]
          created_at?: string | null
          data?: string
          fotos?: string[] | null
          id?: string
          motivo?: string
          periodo?: Database["public"]["Enums"]["periodo_tipo"]
          publicado?: boolean | null
          publicado_em?: string | null
          publicado_por?: string | null
          status_voo?: Database["public"]["Enums"]["status_voo"]
          titulo_curto?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "boletins_publicado_por_fkey"
            columns: ["publicado_por"]
            isOneToOne: false
            referencedRelation: "usuarios_admin"
            referencedColumns: ["id"]
          },
        ]
      }
      logs_atividade: {
        Row: {
          acao: string
          created_at: string | null
          detalhes: Json | null
          id: string
          usuario_id: string | null
        }
        Insert: {
          acao: string
          created_at?: string | null
          detalhes?: Json | null
          id?: string
          usuario_id?: string | null
        }
        Update: {
          acao?: string
          created_at?: string | null
          detalhes?: Json | null
          id?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "logs_atividade_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios_admin"
            referencedColumns: ["id"]
          },
        ]
      }
      paginas_cms: {
        Row: {
          conteudo: string
          id: string
          slug: string
          titulo: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          conteudo: string
          id?: string
          slug: string
          titulo: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          conteudo?: string
          id?: string
          slug?: string
          titulo?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "paginas_cms_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "usuarios_admin"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios_admin: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          email: string
          id: string
          nome: string
          perfil: Database["public"]["Enums"]["perfil_usuario"]
          senha_hash: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          email: string
          id?: string
          nome: string
          perfil?: Database["public"]["Enums"]["perfil_usuario"]
          senha_hash: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          email?: string
          id?: string
          nome?: string
          perfil?: Database["public"]["Enums"]["perfil_usuario"]
          senha_hash?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      bandeira_tipo: "verde" | "amarela" | "vermelha"
      perfil_usuario: "administrador" | "editor"
      periodo_tipo: "manha" | "tarde"
      status_voo: "liberado" | "em_avaliacao" | "cancelado"
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
      bandeira_tipo: ["verde", "amarela", "vermelha"],
      perfil_usuario: ["administrador", "editor"],
      periodo_tipo: ["manha", "tarde"],
      status_voo: ["liberado", "em_avaliacao", "cancelado"],
    },
  },
} as const
