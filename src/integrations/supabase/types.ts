
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
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
      baloes: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          id: string
          nome_batismo: string | null
          observacoes: string | null
          prefixo: string
          proprietario_id: string
          updated_at: string | null
          volume_m3: number
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          id?: string
          nome_batismo?: string | null
          observacoes?: string | null
          prefixo: string
          proprietario_id: string
          updated_at?: string | null
          volume_m3: number
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          id?: string
          nome_batismo?: string | null
          observacoes?: string | null
          prefixo?: string
          proprietario_id?: string
          updated_at?: string | null
          volume_m3?: number
        }
        Relationships: [
          {
            foreignKeyName: "baloes_proprietario_id_fkey"
            columns: ["proprietario_id"]
            isOneToOne: false
            referencedRelation: "membros"
            referencedColumns: ["id"]
          },
        ]
      }
      boletins: {
        Row: {
          atualizado_em: string | null
          audios_urls: string[] | null
          bandeira: Database["public"]["Enums"]["bandeira_tipo"]
          created_at: string | null
          data: string
          fotos_urls: string[] | null
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
          atualizado_em?: string | null
          audios_urls?: string[] | null
          bandeira: Database["public"]["Enums"]["bandeira_tipo"]
          created_at?: string | null
          data: string
          fotos_urls?: string[] | null
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
          atualizado_em?: string | null
          audios_urls?: string[] | null
          bandeira?: Database["public"]["Enums"]["bandeira_tipo"]
          created_at?: string | null
          data?: string
          fotos_urls?: string[] | null
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
      checklist_itens: {
        Row: {
          bloco: number
          created_at: string | null
          descricao: string
          id: string
          item_numero: number
          marcado: boolean | null
          marcado_em: string | null
          marcado_por: string | null
          motivo_nao_marcado: string | null
          observacoes: string | null
          voo_id: string
        }
        Insert: {
          bloco: number
          created_at?: string | null
          descricao: string
          id?: string
          item_numero: number
          marcado?: boolean | null
          marcado_em?: string | null
          marcado_por?: string | null
          motivo_nao_marcado?: string | null
          observacoes?: string | null
          voo_id: string
        }
        Update: {
          bloco?: number
          created_at?: string | null
          descricao?: string
          id?: string
          item_numero?: number
          marcado?: boolean | null
          marcado_em?: string | null
          marcado_por?: string | null
          motivo_nao_marcado?: string | null
          observacoes?: string | null
          voo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_itens_marcado_por_fkey"
            columns: ["marcado_por"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_itens_marcado_por_fkey"
            columns: ["marcado_por"]
            isOneToOne: false
            referencedRelation: "v_user_permissions_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "checklist_itens_marcado_por_fkey"
            columns: ["marcado_por"]
            isOneToOne: false
            referencedRelation: "vw_stats_sincronizacao"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "checklist_itens_voo_id_fkey"
            columns: ["voo_id"]
            isOneToOne: false
            referencedRelation: "voos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_itens_voo_id_fkey"
            columns: ["voo_id"]
            isOneToOne: false
            referencedRelation: "vw_anexos_estatisticas"
            referencedColumns: ["voo_id"]
          },
          {
            foreignKeyName: "checklist_itens_voo_id_fkey"
            columns: ["voo_id"]
            isOneToOne: false
            referencedRelation: "vw_voos_com_baloes"
            referencedColumns: ["voo_id"]
          },
        ]
      }
      dados_offline: {
        Row: {
          conflito_detectado: boolean | null
          created_at: string | null
          dados_json: Json
          dados_servidor: Json | null
          erro_detalhado: Json | null
          id: string
          max_tentativas: number | null
          operacao: string
          real_id: string | null
          sincronizado_em: string | null
          status: Database["public"]["Enums"]["status_sync"] | null
          temp_id: string
          tentativas_sync: number | null
          tipo_dados: Database["public"]["Enums"]["tipo_dados_offline"]
          ultima_tentativa: string | null
          ultimo_erro: string | null
          user_id: string
        }
        Insert: {
          conflito_detectado?: boolean | null
          created_at?: string | null
          dados_json: Json
          dados_servidor?: Json | null
          erro_detalhado?: Json | null
          id?: string
          max_tentativas?: number | null
          operacao: string
          real_id?: string | null
          sincronizado_em?: string | null
          status?: Database["public"]["Enums"]["status_sync"] | null
          temp_id: string
          tentativas_sync?: number | null
          tipo_dados: Database["public"]["Enums"]["tipo_dados_offline"]
          ultima_tentativa?: string | null
          ultimo_erro?: string | null
          user_id: string
        }
        Update: {
          conflito_detectado?: boolean | null
          created_at?: string | null
          dados_json?: Json
          dados_servidor?: Json | null
          erro_detalhado?: Json | null
          id?: string
          max_tentativas?: number | null
          operacao?: string
          real_id?: string | null
          sincronizado_em?: string | null
          status?: Database["public"]["Enums"]["status_sync"] | null
          temp_id?: string
          tentativas_sync?: number | null
          tipo_dados?: Database["public"]["Enums"]["tipo_dados_offline"]
          ultima_tentativa?: string | null
          ultimo_erro?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dados_offline_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dados_offline_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_permissions_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "dados_offline_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_stats_sincronizacao"
            referencedColumns: ["user_id"]
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
      membros: {
        Row: {
          associacao_rbac103: string | null
          cidade: string | null
          cnpj: string | null
          codigo_anac: string | null
          comprovante_url: string | null
          cpf: string | null
          created_at: string | null
          email: string
          endereco: string | null
          estado: string | null
          id: string
          mensalidades_pagas: string[] | null
          nome_completo: string
          nome_empresa: string | null
          numero_licenca: string | null
          observacoes: string | null
          pagamento_inscricao:
            | Database["public"]["Enums"]["membro_pagto_inscricao"]
            | null
          qtd_baloes: number | null
          rbac103: string | null
          rbac91: string | null
          senha_hash: string | null
          status: Database["public"]["Enums"]["membro_status"] | null
          telefone: string
          tipo: Database["public"]["Enums"]["membro_tipo"]
          ultima_mensalidade: string | null
          updated_at: string | null
          user_id: string | null
          username: string | null
          validade_cma: string | null
          validade_habilitacao: string | null
          validade_rbac103: string | null
          volumes_baloes: Json | null
        }
        Insert: {
          associacao_rbac103?: string | null
          cidade?: string | null
          cnpj?: string | null
          codigo_anac?: string | null
          comprovante_url?: string | null
          cpf?: string | null
          created_at?: string | null
          email: string
          endereco?: string | null
          estado?: string | null
          id?: string
          mensalidades_pagas?: string[] | null
          nome_completo: string
          nome_empresa?: string | null
          numero_licenca?: string | null
          observacoes?: string | null
          pagamento_inscricao?:
            | Database["public"]["Enums"]["membro_pagto_inscricao"]
            | null
          qtd_baloes?: number | null
          rbac103?: string | null
          rbac91?: string | null
          senha_hash?: string | null
          status?: Database["public"]["Enums"]["membro_status"] | null
          telefone: string
          tipo: Database["public"]["Enums"]["membro_tipo"]
          ultima_mensalidade?: string | null
          updated_at?: string | null
          user_id?: string | null
          username?: string | null
          validade_cma?: string | null
          validade_habilitacao?: string | null
          validade_rbac103?: string | null
          volumes_baloes?: Json | null
        }
        Update: {
          associacao_rbac103?: string | null
          cidade?: string | null
          cnpj?: string | null
          codigo_anac?: string | null
          comprovante_url?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string
          endereco?: string | null
          estado?: string | null
          id?: string
          mensalidades_pagas?: string[] | null
          nome_completo?: string
          nome_empresa?: string | null
          numero_licenca?: string | null
          observacoes?: string | null
          pagamento_inscricao?:
            | Database["public"]["Enums"]["membro_pagto_inscricao"]
            | null
          qtd_baloes?: number | null
          rbac103?: string | null
          rbac91?: string | null
          senha_hash?: string | null
          status?: Database["public"]["Enums"]["membro_status"] | null
          telefone?: string
          tipo?: Database["public"]["Enums"]["membro_tipo"]
          ultima_mensalidade?: string | null
          updated_at?: string | null
          user_id?: string | null
          username?: string | null
          validade_cma?: string | null
          validade_habilitacao?: string | null
          validade_rbac103?: string | null
          volumes_baloes?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "membros_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membros_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_permissions_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "membros_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_stats_sincronizacao"
            referencedColumns: ["user_id"]
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
      permission_audit_log: {
        Row: {
          acao: string | null
          action: string
          admin_user_id: string | null
          id: number
          ip_address: unknown | null
          new_value: Json | null
          old_value: Json | null
          permission_type: string
          reason: string | null
          recurso: string | null
          target_user_id: string | null
          timestamp: string
          user_agent: string | null
        }
        Insert: {
          acao?: string | null
          action: string
          admin_user_id?: string | null
          id?: never
          ip_address?: unknown | null
          new_value?: Json | null
          old_value?: Json | null
          permission_type: string
          reason?: string | null
          recurso?: string | null
          target_user_id?: string | null
          timestamp?: string
          user_agent?: string | null
        }
        Update: {
          acao?: string | null
          action?: string
          admin_user_id?: string | null
          id?: never
          ip_address?: unknown | null
          new_value?: Json | null
          old_value?: Json | null
          permission_type?: string
          reason?: string | null
          recurso?: string | null
          target_user_id?: string | null
          timestamp?: string
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
            foreignKeyName: "permission_audit_log_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "v_user_permissions_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "permission_audit_log_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "vw_stats_sincronizacao"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "permission_audit_log_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "permission_audit_log_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "v_user_permissions_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "permission_audit_log_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "vw_stats_sincronizacao"
            referencedColumns: ["user_id"]
          },
        ]
      }
      permissoes: {
        Row: {
          acao: string
          atualizado_em: string | null
          criado_em: string | null
          id: string
          permitido: boolean
          recurso: string
          role: string
        }
        Insert: {
          acao: string
          atualizado_em?: string | null
          criado_em?: string | null
          id?: string
          permitido?: boolean
          recurso: string
          role: string
        }
        Update: {
          acao?: string
          atualizado_em?: string | null
          criado_em?: string | null
          id?: string
          permitido?: boolean
          recurso?: string
          role?: string
        }
        Relationships: []
      }
      push_delivery_logs: {
        Row: {
          clicked_at: string | null
          created_at: string | null
          delivery_status: string
          error_message: string | null
          http_status: number | null
          id: string
          notification_id: string
          push_service_response: Json | null
          sent_at: string | null
          subscription_id: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          clicked_at?: string | null
          created_at?: string | null
          delivery_status: string
          error_message?: string | null
          http_status?: number | null
          id?: string
          notification_id: string
          push_service_response?: Json | null
          sent_at?: string | null
          subscription_id: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          clicked_at?: string | null
          created_at?: string | null
          delivery_status?: string
          error_message?: string | null
          http_status?: number | null
          id?: string
          notification_id?: string
          push_service_response?: Json | null
          sent_at?: string | null
          subscription_id?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_delivery_logs_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "push_notifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "push_delivery_logs_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "push_subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "push_delivery_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "push_delivery_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_permissions_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "push_delivery_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_stats_sincronizacao"
            referencedColumns: ["user_id"]
          },
        ]
      }
      push_notifications: {
        Row: {
          created_at: string | null
          created_by: string
          icon_url: string | null
          id: string
          internal_link: string | null
          message: string
          recurring_rule: Json | null
          scheduled_date: string | null
          send_type: string
          sent_at: string | null
          status: string
          target_audience: Json
          title: string
          total_delivered: number | null
          total_expired: number | null
          total_failed: number | null
          total_sent: number | null
          total_targeted: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          icon_url?: string | null
          id?: string
          internal_link?: string | null
          message: string
          recurring_rule?: Json | null
          scheduled_date?: string | null
          send_type?: string
          sent_at?: string | null
          status?: string
          target_audience?: Json
          title: string
          total_delivered?: number | null
          total_expired?: number | null
          total_failed?: number | null
          total_sent?: number | null
          total_targeted?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          icon_url?: string | null
          id?: string
          internal_link?: string | null
          message?: string
          recurring_rule?: Json | null
          scheduled_date?: string | null
          send_type?: string
          sent_at?: string | null
          status?: string
          target_audience?: Json
          title?: string
          total_delivered?: number | null
          total_expired?: number | null
          total_failed?: number | null
          total_sent?: number | null
          total_targeted?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "push_notifications_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "push_notifications_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_user_permissions_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "push_notifications_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vw_stats_sincronizacao"
            referencedColumns: ["user_id"]
          },
        ]
      }
      push_scheduled_jobs: {
        Row: {
          created_at: string | null
          failure_count: number | null
          id: string
          job_type: string
          last_error: string | null
          last_run_at: string | null
          max_runs: number | null
          next_run_at: string
          notification_id: string
          recurring_rule: Json | null
          run_count: number | null
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          failure_count?: number | null
          id?: string
          job_type: string
          last_error?: string | null
          last_run_at?: string | null
          max_runs?: number | null
          next_run_at: string
          notification_id: string
          recurring_rule?: Json | null
          run_count?: number | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          failure_count?: number | null
          id?: string
          job_type?: string
          last_error?: string | null
          last_run_at?: string | null
          max_runs?: number | null
          next_run_at?: string
          notification_id?: string
          recurring_rule?: Json | null
          run_count?: number | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "push_scheduled_jobs_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "push_notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          active: boolean | null
          auth_key: string
          created_at: string | null
          endpoint: string
          expires_at: string | null
          id: string
          ip_address: unknown | null
          last_used_at: string | null
          p256dh_key: string
          platform: string | null
          updated_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          active?: boolean | null
          auth_key: string
          created_at?: string | null
          endpoint: string
          expires_at?: string | null
          id?: string
          ip_address?: unknown | null
          last_used_at?: string | null
          p256dh_key: string
          platform?: string | null
          updated_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          active?: boolean | null
          auth_key?: string
          created_at?: string | null
          endpoint?: string
          expires_at?: string | null
          id?: string
          ip_address?: unknown | null
          last_used_at?: string | null
          p256dh_key?: string
          platform?: string | null
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_permissions_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_stats_sincronizacao"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_permissions: {
        Row: {
          acao: string
          concedido_em: string
          concedido_por: string | null
          created_at: string
          data_expiracao: string | null
          id: number
          nivel_acesso: string | null
          permitido: boolean
          recurso: string
          restricoes: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          acao: string
          concedido_em?: string
          concedido_por?: string | null
          created_at?: string
          data_expiracao?: string | null
          id?: never
          nivel_acesso?: string | null
          permitido?: boolean
          recurso: string
          restricoes?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          acao?: string
          concedido_em?: string
          concedido_por?: string | null
          created_at?: string
          data_expiracao?: string | null
          id?: never
          nivel_acesso?: string | null
          permitido?: boolean
          recurso?: string
          restricoes?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_permissions_concedido_por_fkey"
            columns: ["concedido_por"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_permissions_concedido_por_fkey"
            columns: ["concedido_por"]
            isOneToOne: false
            referencedRelation: "v_user_permissions_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_permissions_concedido_por_fkey"
            columns: ["concedido_por"]
            isOneToOne: false
            referencedRelation: "vw_stats_sincronizacao"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_permissions_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_stats_sincronizacao"
            referencedColumns: ["user_id"]
          },
        ]
      }
      users: {
        Row: {
          ativo: boolean | null
          auth_id: string | null
          celular: string | null
          cep: string | null
          cidade: string | null
          cnpj: string | null
          created_at: string | null
          email: string
          endereco: string | null
          id: string
          migrated_at: string | null
          nome: string | null
          nome_fantasia: string | null
          primeira_senha: boolean | null
          razao_social: string | null
          role: Database["public"]["Enums"]["user_role"]
          senha_hash: string | null
          telefone: string | null
          updated_at: string | null
          username: string | null
          whatsapp_group_joined: boolean | null
          whatsapp_modal_shown: boolean | null
        }
        Insert: {
          ativo?: boolean | null
          auth_id?: string | null
          celular?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          created_at?: string | null
          email: string
          endereco?: string | null
          id?: string
          migrated_at?: string | null
          nome?: string | null
          nome_fantasia?: string | null
          primeira_senha?: boolean | null
          razao_social?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          senha_hash?: string | null
          telefone?: string | null
          updated_at?: string | null
          username?: string | null
          whatsapp_group_joined?: boolean | null
          whatsapp_modal_shown?: boolean | null
        }
        Update: {
          ativo?: boolean | null
          auth_id?: string | null
          celular?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          created_at?: string | null
          email?: string
          endereco?: string | null
          id?: string
          migrated_at?: string | null
          nome?: string | null
          nome_fantasia?: string | null
          primeira_senha?: boolean | null
          razao_social?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          senha_hash?: string | null
          telefone?: string | null
          updated_at?: string | null
          username?: string | null
          whatsapp_group_joined?: boolean | null
          whatsapp_modal_shown?: boolean | null
        }
        Relationships: []
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
      vinculos_agencia_piloto: {
        Row: {
          agencia_id: string
          convite_enviado_em: string | null
          created_at: string | null
          id: string
          observacoes: string | null
          piloto_id: string
          respondido_em: string | null
          status: Database["public"]["Enums"]["vinculo_status"] | null
          updated_at: string | null
        }
        Insert: {
          agencia_id: string
          convite_enviado_em?: string | null
          created_at?: string | null
          id?: string
          observacoes?: string | null
          piloto_id: string
          respondido_em?: string | null
          status?: Database["public"]["Enums"]["vinculo_status"] | null
          updated_at?: string | null
        }
        Update: {
          agencia_id?: string
          convite_enviado_em?: string | null
          created_at?: string | null
          id?: string
          observacoes?: string | null
          piloto_id?: string
          respondido_em?: string | null
          status?: Database["public"]["Enums"]["vinculo_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vinculos_agencia_piloto_agencia_id_fkey"
            columns: ["agencia_id"]
            isOneToOne: false
            referencedRelation: "membros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vinculos_agencia_piloto_piloto_id_fkey"
            columns: ["piloto_id"]
            isOneToOne: false
            referencedRelation: "membros"
            referencedColumns: ["id"]
          },
        ]
      }
      voos: {
        Row: {
          adultos_previstos: number | null
          adultos_reais: number | null
          adultos_transportados: number | null
          agencia_id: string | null
          altitude_maxima: number | null
          created_at: string | null
          created_by: string | null
          criancas_previstas: number | null
          criancas_reais: number | null
          criancas_transportadas: number | null
          data_voo: string
          duracao_minutos: number | null
          horario_previsto: string | null
          horario_real_decolagem: string | null
          horario_real_pouso: string | null
          id: string
          local_decolagem_previsto: string
          local_decolagem_real: string | null
          local_pouso: string | null
          local_pouso_real: string | null
          motivo_cancelamento: string | null
          observacoes_planejamento: string | null
          observacoes_pos_voo: string | null
          periodo: Database["public"]["Enums"]["voo_periodo"]
          piloto_id: string
          status: Database["public"]["Enums"]["voo_status"] | null
          updated_at: string | null
        }
        Insert: {
          adultos_previstos?: number | null
          adultos_reais?: number | null
          adultos_transportados?: number | null
          agencia_id?: string | null
          altitude_maxima?: number | null
          created_at?: string | null
          created_by?: string | null
          criancas_previstas?: number | null
          criancas_reais?: number | null
          criancas_transportadas?: number | null
          data_voo: string
          duracao_minutos?: number | null
          horario_previsto?: string | null
          horario_real_decolagem?: string | null
          horario_real_pouso?: string | null
          id?: string
          local_decolagem_previsto: string
          local_decolagem_real?: string | null
          local_pouso?: string | null
          local_pouso_real?: string | null
          motivo_cancelamento?: string | null
          observacoes_planejamento?: string | null
          observacoes_pos_voo?: string | null
          periodo: Database["public"]["Enums"]["voo_periodo"]
          piloto_id: string
          status?: Database["public"]["Enums"]["voo_status"] | null
          updated_at?: string | null
        }
        Update: {
          adultos_previstos?: number | null
          adultos_reais?: number | null
          adultos_transportados?: number | null
          agencia_id?: string | null
          altitude_maxima?: number | null
          created_at?: string | null
          created_by?: string | null
          criancas_previstas?: number | null
          criancas_reais?: number | null
          criancas_transportadas?: number | null
          data_voo?: string
          duracao_minutos?: number | null
          horario_previsto?: string | null
          horario_real_decolagem?: string | null
          horario_real_pouso?: string | null
          id?: string
          local_decolagem_previsto?: string
          local_decolagem_real?: string | null
          local_pouso?: string | null
          local_pouso_real?: string | null
          motivo_cancelamento?: string | null
          observacoes_planejamento?: string | null
          observacoes_pos_voo?: string | null
          periodo?: Database["public"]["Enums"]["voo_periodo"]
          piloto_id?: string
          status?: Database["public"]["Enums"]["voo_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "voos_agencia_id_fkey"
            columns: ["agencia_id"]
            isOneToOne: false
            referencedRelation: "membros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voos_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voos_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_user_permissions_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "voos_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vw_stats_sincronizacao"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "voos_piloto_id_fkey"
            columns: ["piloto_id"]
            isOneToOne: false
            referencedRelation: "membros"
            referencedColumns: ["id"]
          },
        ]
      }
      voos_anexos: {
        Row: {
          created_at: string
          id: string
          metadata: Json | null
          mime_type: string
          nome_arquivo: string
          nome_original: string
          publico: boolean
          tamanho_bytes: number
          tipo: Database["public"]["Enums"]["tipo_anexo"]
          updated_at: string
          uploaded_em: string
          uploaded_por: string | null
          url_storage: string
          voo_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json | null
          mime_type: string
          nome_arquivo: string
          nome_original: string
          publico?: boolean
          tamanho_bytes: number
          tipo: Database["public"]["Enums"]["tipo_anexo"]
          updated_at?: string
          uploaded_em?: string
          uploaded_por?: string | null
          url_storage: string
          voo_id: string
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json | null
          mime_type?: string
          nome_arquivo?: string
          nome_original?: string
          publico?: boolean
          tamanho_bytes?: number
          tipo?: Database["public"]["Enums"]["tipo_anexo"]
          updated_at?: string
          uploaded_em?: string
          uploaded_por?: string | null
          url_storage?: string
          voo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "voos_anexos_voo_id_fkey"
            columns: ["voo_id"]
            isOneToOne: false
            referencedRelation: "voos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voos_anexos_voo_id_fkey"
            columns: ["voo_id"]
            isOneToOne: false
            referencedRelation: "vw_anexos_estatisticas"
            referencedColumns: ["voo_id"]
          },
          {
            foreignKeyName: "voos_anexos_voo_id_fkey"
            columns: ["voo_id"]
            isOneToOne: false
            referencedRelation: "vw_voos_com_baloes"
            referencedColumns: ["voo_id"]
          },
        ]
      }
      voos_baloes: {
        Row: {
          adultos_previstos: number | null
          adultos_reais: number | null
          balao_id: string
          created_at: string | null
          criancas_previstas: number | null
          criancas_reais: number | null
          id: string
          observacoes: string | null
          voo_id: string
        }
        Insert: {
          adultos_previstos?: number | null
          adultos_reais?: number | null
          balao_id: string
          created_at?: string | null
          criancas_previstas?: number | null
          criancas_reais?: number | null
          id?: string
          observacoes?: string | null
          voo_id: string
        }
        Update: {
          adultos_previstos?: number | null
          adultos_reais?: number | null
          balao_id?: string
          created_at?: string | null
          criancas_previstas?: number | null
          criancas_reais?: number | null
          id?: string
          observacoes?: string | null
          voo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "voos_baloes_balao_id_fkey"
            columns: ["balao_id"]
            isOneToOne: false
            referencedRelation: "baloes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voos_baloes_voo_id_fkey"
            columns: ["voo_id"]
            isOneToOne: false
            referencedRelation: "voos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voos_baloes_voo_id_fkey"
            columns: ["voo_id"]
            isOneToOne: false
            referencedRelation: "vw_anexos_estatisticas"
            referencedColumns: ["voo_id"]
          },
          {
            foreignKeyName: "voos_baloes_voo_id_fkey"
            columns: ["voo_id"]
            isOneToOne: false
            referencedRelation: "vw_voos_com_baloes"
            referencedColumns: ["voo_id"]
          },
        ]
      }
    }
    Views: {
      v_user_permissions_summary: {
        Row: {
          acao: string | null
          concedido_em: string | null
          concedido_por_nome: string | null
          data_expiracao: string | null
          email: string | null
          nivel_acesso: string | null
          nome: string | null
          permitido: boolean | null
          recurso: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          user_id: string | null
        }
        Relationships: []
      }
      vw_anexos_estatisticas: {
        Row: {
          data_voo: string | null
          fotos: number | null
          periodo: Database["public"]["Enums"]["voo_periodo"] | null
          regulamentos: number | null
          status: Database["public"]["Enums"]["voo_status"] | null
          tamanho_total_bytes: number | null
          tamanho_total_formatado: string | null
          total_anexos: number | null
          track_logs: number | null
          voo_id: string | null
        }
        Relationships: []
      }
      vw_checklist_progresso: {
        Row: {
          bloco: number | null
          itens_marcados: number | null
          percentual_concluido: number | null
          total_itens: number | null
          voo_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checklist_itens_voo_id_fkey"
            columns: ["voo_id"]
            isOneToOne: false
            referencedRelation: "voos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_itens_voo_id_fkey"
            columns: ["voo_id"]
            isOneToOne: false
            referencedRelation: "vw_anexos_estatisticas"
            referencedColumns: ["voo_id"]
          },
          {
            foreignKeyName: "checklist_itens_voo_id_fkey"
            columns: ["voo_id"]
            isOneToOne: false
            referencedRelation: "vw_voos_com_baloes"
            referencedColumns: ["voo_id"]
          },
        ]
      }
      vw_problemas_sincronizacao: {
        Row: {
          created_at: string | null
          id: string | null
          max_tentativas: number | null
          operacao: string | null
          status: Database["public"]["Enums"]["status_sync"] | null
          tentativas_sync: number | null
          tipo_dados: Database["public"]["Enums"]["tipo_dados_offline"] | null
          tipo_problema: string | null
          ultima_tentativa: string | null
          ultimo_erro: string | null
          usuario_nome: string | null
        }
        Relationships: []
      }
      vw_stats_sincronizacao: {
        Row: {
          anexos: number | null
          checklists: number | null
          com_erro: number | null
          conflitos: number | null
          pendentes: number | null
          primeiro_item: string | null
          sincronizados: number | null
          sincronizando: number | null
          total_itens: number | null
          ultimo_item: string | null
          user_id: string | null
          usuario_nome: string | null
          voos: number | null
        }
        Relationships: []
      }
      vw_voos_anexos: {
        Row: {
          agencia_nome: string | null
          anexo_id: string | null
          data_voo: string | null
          metadata: Json | null
          mime_type: string | null
          nome_arquivo: string | null
          nome_original: string | null
          periodo: Database["public"]["Enums"]["voo_periodo"] | null
          piloto_nome: string | null
          publico: boolean | null
          tamanho_bytes: number | null
          tamanho_formatado: string | null
          tipo: Database["public"]["Enums"]["tipo_anexo"] | null
          tipo_descricao: string | null
          uploaded_em: string | null
          uploaded_por_nome: string | null
          url_storage: string | null
          voo_id: string | null
          voo_status: Database["public"]["Enums"]["voo_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "voos_anexos_voo_id_fkey"
            columns: ["voo_id"]
            isOneToOne: false
            referencedRelation: "voos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voos_anexos_voo_id_fkey"
            columns: ["voo_id"]
            isOneToOne: false
            referencedRelation: "vw_anexos_estatisticas"
            referencedColumns: ["voo_id"]
          },
          {
            foreignKeyName: "voos_anexos_voo_id_fkey"
            columns: ["voo_id"]
            isOneToOne: false
            referencedRelation: "vw_voos_com_baloes"
            referencedColumns: ["voo_id"]
          },
        ]
      }
      vw_voos_com_baloes: {
        Row: {
          adultos_previstos: number | null
          agencia_empresa: string | null
          agencia_id: string | null
          agencia_nome: string | null
          balao_adultos_previstos: number | null
          balao_criancas_previstas: number | null
          balao_id: string | null
          balao_nome: string | null
          balao_prefixo: string | null
          balao_volume: number | null
          created_at: string | null
          created_by: string | null
          criancas_previstas: number | null
          data_voo: string | null
          horario_previsto: string | null
          local_decolagem_previsto: string | null
          observacoes_planejamento: string | null
          periodo: Database["public"]["Enums"]["voo_periodo"] | null
          piloto_email: string | null
          piloto_id: string | null
          piloto_nome: string | null
          updated_at: string | null
          voo_id: string | null
          voo_status: Database["public"]["Enums"]["voo_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "voos_agencia_id_fkey"
            columns: ["agencia_id"]
            isOneToOne: false
            referencedRelation: "membros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voos_baloes_balao_id_fkey"
            columns: ["balao_id"]
            isOneToOne: false
            referencedRelation: "baloes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voos_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voos_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_user_permissions_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "voos_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "vw_stats_sincronizacao"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "voos_piloto_id_fkey"
            columns: ["piloto_id"]
            isOneToOne: false
            referencedRelation: "membros"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      cleanup_expired_subscriptions: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      contar_anexos_voo: {
        Args: {
          p_voo_id: string
          p_tipo?: Database["public"]["Enums"]["tipo_anexo"]
        }
        Returns: number
      }
      criar_checklist_padrao: {
        Args: { p_voo_id: string }
        Returns: undefined
      }
      criar_checklist_sob_demanda: {
        Args: { voo_id: string }
        Returns: undefined
      }
      debug_admin_check: {
        Args: Record<PropertyKey, never>
        Returns: {
          current_auth_uid: string
          auth_uid_is_null: boolean
          total_users_count: number
          admin_users_count: number
        }[]
      }
      debug_pilot_access: {
        Args: { pilot_member_id: string }
        Returns: {
          user_authenticated: boolean
          user_id: string
          is_pilot: boolean
          member_id: string
          member_status: string
        }[]
      }
      generate_slug: {
        Args: { brand: string; model: string; year_model: number }
        Returns: string
      }
      gerar_nome_arquivo_unico: {
        Args: {
          p_voo_id: string
          p_tipo: Database["public"]["Enums"]["tipo_anexo"]
          p_extensao: string
        }
        Returns: string
      }
      get_user_combined_permissions: {
        Args: { p_user_id: string }
        Returns: {
          recurso: string
          acao: string
          permitido: boolean
          fonte: string
          nivel_acesso: string
          restricoes: Json
        }[]
      }
      get_user_combined_permissions_debug_simple: {
        Args: { p_user_id: string }
        Returns: {
          recurso: string
          acao: string
          permitido: boolean
          fonte: string
          nivel_acesso: string
          restricoes: Json
        }[]
      }
      get_user_combined_permissions_debug_v1: {
        Args: { p_user_id: string }
        Returns: {
          recurso: string
          acao: string
          permitido: boolean
          fonte: string
          nivel_acesso: string
          restricoes: Json
        }[]
      }
      get_user_combined_permissions_debug_v2: {
        Args: { p_user_id: string }
        Returns: {
          recurso: string
          acao: string
          permitido: boolean
          fonte: string
          nivel_acesso: string
          restricoes: Json
        }[]
      }
      limpar_dados_sincronizados: {
        Args: { p_dias_retencao?: number }
        Returns: number
      }
      marcar_conflito: {
        Args: { p_item_id: string; p_dados_servidor: Json }
        Returns: boolean
      }
      marcar_erro_sincronizacao: {
        Args: { p_item_id: string; p_erro: string; p_erro_detalhado?: Json }
        Returns: boolean
      }
      marcar_sincronizado: {
        Args: { p_item_id: string; p_real_id: string }
        Returns: boolean
      }
      obter_url_anexo_assinada: {
        Args: { p_anexo_id: string; p_duracao_segundos?: number }
        Returns: string
      }
      processar_fila_sincronizacao: {
        Args: { p_user_id: string; p_limite?: number }
        Returns: {
          item_id: string
          tipo_dados: Database["public"]["Enums"]["tipo_dados_offline"]
          operacao: string
          dados_json: Json
          temp_id: string
        }[]
      }
      resolver_conflito: {
        Args: { p_item_id: string; p_usar_servidor?: boolean }
        Returns: boolean
      }
      user_has_permission: {
        Args: { p_user_id: string; p_recurso: string; p_acao: string }
        Returns: boolean
      }
      validar_prefixo_balao: {
        Args: { prefixo: string }
        Returns: boolean
      }
      validar_tipo_arquivo: {
        Args: {
          p_tipo: Database["public"]["Enums"]["tipo_anexo"]
          p_mime_type: string
          p_nome_arquivo: string
        }
        Returns: boolean
      }
      verificar_disponibilidade_balao: {
        Args: {
          p_balao_id: string
          p_data_voo: string
          p_periodo: Database["public"]["Enums"]["voo_periodo"]
          p_voo_id?: string
        }
        Returns: boolean
      }
    }
    Enums: {
      bandeira_tipo: "verde" | "amarela" | "vermelha"
      membro_pagto_inscricao: "aguardando" | "ok"
      membro_status: "pendente" | "ativo" | "recusado"
      membro_tipo: "piloto" | "agencia"
      perfil_usuario: "administrador" | "editor"
      periodo_tipo: "manha" | "tarde"
      status_sync:
        | "pendente"
        | "sincronizando"
        | "sincronizado"
        | "erro"
        | "conflito"
      status_voo: "liberado" | "em_avaliacao" | "cancelado"
      tipo_anexo: "track_log" | "foto_voo" | "regulamento_assinado"
      tipo_dados_offline: "voo" | "checklist" | "anexo" | "balao" | "vinculo"
      user_role:
        | "admin"
        | "meteo"
        | "tesouraria"
        | "leitura"
        | "piloto"
        | "agencia"
      vinculo_status: "pendente" | "aceito" | "recusado"
      voo_periodo: "manha" | "tarde"
      voo_status:
        | "rascunho"
        | "planejado"
        | "checklist_bloco1"
        | "checklist_bloco2"
        | "checklist_concluido"
        | "finalizado"
        | "cancelado"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      bandeira_tipo: ["verde", "amarela", "vermelha"],
      membro_pagto_inscricao: ["aguardando", "ok"],
      membro_status: ["pendente", "ativo", "recusado"],
      membro_tipo: ["piloto", "agencia"],
      perfil_usuario: ["administrador", "editor"],
      periodo_tipo: ["manha", "tarde"],
      status_sync: [
        "pendente",
        "sincronizando",
        "sincronizado",
        "erro",
        "conflito",
      ],
      status_voo: ["liberado", "em_avaliacao", "cancelado"],
      tipo_anexo: ["track_log", "foto_voo", "regulamento_assinado"],
      tipo_dados_offline: ["voo", "checklist", "anexo", "balao", "vinculo"],
      user_role: [
        "admin",
        "meteo",
        "tesouraria",
        "leitura",
        "piloto",
        "agencia",
      ],
      vinculo_status: ["pendente", "aceito", "recusado"],
      voo_periodo: ["manha", "tarde"],
      voo_status: [
        "rascunho",
        "planejado",
        "checklist_bloco1",
        "checklist_bloco2",
        "checklist_concluido",
        "finalizado",
        "cancelado",
      ],
    },
  },
} as const
