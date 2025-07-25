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
      users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          nome: string | null
          role: 'admin' | 'meteo' | 'tesouraria' | 'piloto' | 'agencia' | null
          updated_at: string | null
          whatsapp_group_joined: boolean | null
          whatsapp_modal_shown: boolean | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          nome?: string | null
          role?: 'admin' | 'meteo' | 'tesouraria' | 'piloto' | 'agencia' | null
          updated_at?: string | null
          whatsapp_group_joined?: boolean | null
          whatsapp_modal_shown?: boolean | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          nome?: string | null
          role?: 'admin' | 'meteo' | 'tesouraria' | 'piloto' | 'agencia' | null
          updated_at?: string | null
          whatsapp_group_joined?: boolean | null
          whatsapp_modal_shown?: boolean | null
        }
        Relationships: []
      }
      user_permissions: {
        Row: {
          id: number
          user_id: string
          recurso: string
          acao: string
          permitido: boolean
          nivel_acesso: string | null
          restricoes: Json | null
          concedido_por: string | null
          concedido_em: string
          data_expiracao: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: never
          user_id: string
          recurso: string
          acao: string
          permitido?: boolean
          nivel_acesso?: string | null
          restricoes?: Json | null
          concedido_por?: string | null
          concedido_em?: string
          data_expiracao?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: never
          user_id?: string
          recurso?: string
          acao?: string
          permitido?: boolean
          nivel_acesso?: string | null
          restricoes?: Json | null
          concedido_por?: string | null
          concedido_em?: string
          data_expiracao?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_permissions_concedido_por_fkey"
            columns: ["concedido_por"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      permission_audit_log: {
        Row: {
          id: number
          timestamp: string
          admin_user_id: string | null
          target_user_id: string | null
          action: string
          permission_type: string
          recurso: string | null
          acao: string | null
          old_value: Json | null
          new_value: Json | null
          reason: string | null
          ip_address: string | null
          user_agent: string | null
        }
        Insert: {
          id?: never
          timestamp?: string
          admin_user_id?: string | null
          target_user_id?: string | null
          action: string
          permission_type: string
          recurso?: string | null
          acao?: string | null
          old_value?: Json | null
          new_value?: Json | null
          reason?: string | null
          ip_address?: string | null
          user_agent?: string | null
        }
        Update: {
          id?: never
          timestamp?: string
          admin_user_id?: string | null
          target_user_id?: string | null
          action?: string
          permission_type?: string
          recurso?: string | null
          acao?: string | null
          old_value?: Json | null
          new_value?: Json | null
          reason?: string | null
          ip_address?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "permission_audit_log_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "permission_audit_log_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      v_user_permissions_summary: {
        Row: {
          user_id: string | null
          email: string | null
          nome: string | null
          role: 'admin' | 'meteo' | 'tesouraria' | 'piloto' | 'agencia' | null
          recurso: string | null
          acao: string | null
          permitido: boolean | null
          nivel_acesso: string | null
          concedido_em: string | null
          data_expiracao: string | null
          concedido_por_nome: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_user_combined_permissions: {
        Args: {
          p_user_id: string
        }
        Returns: {
          recurso: string
          acao: string
          permitido: boolean
          fonte: string
          nivel_acesso: string | null
          restricoes: Json | null
        }[]
      }
      user_has_permission: {
        Args: {
          p_user_id: string
          p_recurso: string
          p_acao: string
        }
        Returns: boolean
      }
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

// Tipos auxiliares para sistema de permissões
export type UserRole = 'admin' | 'meteo' | 'tesouraria' | 'piloto' | 'agencia';

export interface Permission {
  recurso: string;
  acao: string;
  permitido: boolean;
  fonte: 'role' | 'user_specific';
  nivel_acesso?: string | null;
  restricoes?: Json | null;
}

export interface UserPermission {
  id: number;
  user_id: string;
  recurso: string;
  acao: string;
  permitido: boolean;
  nivel_acesso?: string | null;
  restricoes?: Json | null;
  concedido_por?: string | null;
  concedido_em: string;
  data_expiracao?: string | null;
}

export interface PermissionAuditLog {
  id: number;
  timestamp: string;
  admin_user_id?: string | null;
  target_user_id?: string | null;
  action: 'grant' | 'revoke' | 'modify';
  permission_type: 'role' | 'user_specific';
  recurso?: string | null;
  acao?: string | null;
  old_value?: Json | null;
  new_value?: Json | null;
  reason?: string | null;
}

export interface UserPermissionsSummary {
  user_id: string;
  email: string;
  nome: string;
  role: UserRole;
  recurso: string;
  acao: string;
  permitido: boolean;
  nivel_acesso?: string | null;
  concedido_em: string;
  data_expiracao?: string | null;
  concedido_por_nome?: string | null;
}

// Tipos para recursos e ações comuns do sistema
export type SystemResource = 
  | 'voos' 
  | 'baloes' 
  | 'boletins' 
  | 'associados' 
  | 'usuarios' 
  | 'permissoes'
  | 'dashboard'
  | 'relatorios'
  | 'configuracoes';

export type SystemAction = 
  | 'create' 
  | 'read' 
  | 'update' 
  | 'delete' 
  | 'approve' 
  | 'export'
  | 'manage'
  | 'view_all'
  | 'view_own';

// Interface para verificação de permissões
export interface PermissionCheck {
  recurso: SystemResource | string;
  acao: SystemAction | string;
  required?: boolean;
}

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
