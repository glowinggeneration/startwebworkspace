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
      accounts: {
        Row: {
          country: string | null
          created_at: string
          id: string
          industry_id: string | null
          is_reference_client: boolean
          name: string
          reference_note: string | null
          updated_at: string
          website: string | null
          workspace_id: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          id?: string
          industry_id?: string | null
          is_reference_client?: boolean
          name: string
          reference_note?: string | null
          updated_at?: string
          website?: string | null
          workspace_id: string
        }
        Update: {
          country?: string | null
          created_at?: string
          id?: string
          industry_id?: string | null
          is_reference_client?: boolean
          name?: string
          reference_note?: string | null
          updated_at?: string
          website?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_industry_id_fkey"
            columns: ["industry_id"]
            isOneToOne: false
            referencedRelation: "industries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: string
          ip: string | null
          metadata: Json
          resource_id: string | null
          resource_table: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: string
          ip?: string | null
          metadata?: Json
          resource_id?: string | null
          resource_table: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          ip?: string | null
          metadata?: Json
          resource_id?: string | null
          resource_table?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          account_id: string
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          role_title: string | null
          workspace_id: string
        }
        Insert: {
          account_id: string
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          role_title?: string | null
          workspace_id: string
        }
        Update: {
          account_id?: string
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          role_title?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_activity_log: {
        Row: {
          conversations: number
          created_at: string
          hours_calling: number
          id: string
          industry_focus_id: string | null
          log_date: string
          meetings_booked: number
          meetings_held: number
          notes_for_tomorrow: string | null
          offers_sent: number
          touches: number
          updated_at: string
          user_id: string
          wins: number
          workspace_id: string
        }
        Insert: {
          conversations?: number
          created_at?: string
          hours_calling?: number
          id?: string
          industry_focus_id?: string | null
          log_date: string
          meetings_booked?: number
          meetings_held?: number
          notes_for_tomorrow?: string | null
          offers_sent?: number
          touches?: number
          updated_at?: string
          user_id: string
          wins?: number
          workspace_id: string
        }
        Update: {
          conversations?: number
          created_at?: string
          hours_calling?: number
          id?: string
          industry_focus_id?: string | null
          log_date?: string
          meetings_booked?: number
          meetings_held?: number
          notes_for_tomorrow?: string | null
          offers_sent?: number
          touches?: number
          updated_at?: string
          user_id?: string
          wins?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_activity_log_industry_focus_id_fkey"
            columns: ["industry_focus_id"]
            isOneToOne: false
            referencedRelation: "industries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_activity_log_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_handoffs: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          created_at: string
          deal_id: string
          handed_off_at: string
          handed_off_by: string | null
          id: string
          logins_note: string | null
          project_id: string | null
          scope: string | null
          signed_document_url: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          created_at?: string
          deal_id: string
          handed_off_at?: string
          handed_off_by?: string | null
          id?: string
          logins_note?: string | null
          project_id?: string | null
          scope?: string | null
          signed_document_url?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          created_at?: string
          deal_id?: string
          handed_off_at?: string
          handed_off_by?: string | null
          id?: string
          logins_note?: string | null
          project_id?: string | null
          scope?: string | null
          signed_document_url?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_handoffs_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: true
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_handoffs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_handoffs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          account_id: string
          created_at: string
          id: string
          industry_id: string | null
          invoiced_at: string | null
          next_date: string | null
          next_step: string | null
          notes: string | null
          owner_id: string | null
          package_id: string | null
          referral_ask_logged: boolean
          status: string
          updated_at: string
          value: number
          won_at: string | null
          workspace_id: string
        }
        Insert: {
          account_id: string
          created_at?: string
          id?: string
          industry_id?: string | null
          invoiced_at?: string | null
          next_date?: string | null
          next_step?: string | null
          notes?: string | null
          owner_id?: string | null
          package_id?: string | null
          referral_ask_logged?: boolean
          status?: string
          updated_at?: string
          value: number
          won_at?: string | null
          workspace_id: string
        }
        Update: {
          account_id?: string
          created_at?: string
          id?: string
          industry_id?: string | null
          invoiced_at?: string | null
          next_date?: string | null
          next_step?: string | null
          notes?: string | null
          owner_id?: string | null
          package_id?: string | null
          referral_ask_logged?: boolean
          status?: string
          updated_at?: string
          value?: number
          won_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deals_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_industry_id_fkey"
            columns: ["industry_id"]
            isOneToOne: false
            referencedRelation: "industries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
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
      industries: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
          sort_order: number
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
          sort_order?: number
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
          sort_order?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "industries_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      industry_playbooks: {
        Row: {
          created_at: string
          id: string
          industry_id: string
          opening_line: string
          questions: string[]
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          industry_id: string
          opening_line: string
          questions?: string[]
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          industry_id?: string
          opening_line?: string
          questions?: string[]
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "industry_playbooks_industry_id_fkey"
            columns: ["industry_id"]
            isOneToOne: false
            referencedRelation: "industries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "industry_playbooks_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_line_items: {
        Row: {
          description: string
          id: string
          invoice_id: string
          package_id: string | null
          quantity: number
          sort_order: number
          unit_price: number
        }
        Insert: {
          description: string
          id?: string
          invoice_id: string
          package_id?: string | null
          quantity?: number
          sort_order?: number
          unit_price: number
        }
        Update: {
          description?: string
          id?: string
          invoice_id?: string
          package_id?: string | null
          quantity?: number
          sort_order?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_line_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_line_items_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          account_id: string
          created_at: string
          deal_id: string | null
          due_date: string | null
          id: string
          invoice_number: string
          issue_date: string
          notes: string | null
          project_id: string | null
          quote_id: string | null
          status: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          account_id: string
          created_at?: string
          deal_id?: string | null
          due_date?: string | null
          id?: string
          invoice_number: string
          issue_date?: string
          notes?: string | null
          project_id?: string | null
          quote_id?: string | null
          status?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          account_id?: string
          created_at?: string
          deal_id?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string
          issue_date?: string
          notes?: string | null
          project_id?: string | null
          quote_id?: string | null
          status?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_plan_lines: {
        Row: {
          created_at: string
          id: string
          month: string
          package_id: string
          planned_units: number
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          month: string
          package_id: string
          planned_units?: number
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          month?: string
          package_id?: string
          planned_units?: number
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "monthly_plan_lines_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monthly_plan_lines_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_targets: {
        Row: {
          calling_start_date: string | null
          coverage_multiplier: number
          created_at: string
          id: string
          month: string
          target_amount: number
          updated_at: string
          working_days: number | null
          workspace_id: string
        }
        Insert: {
          calling_start_date?: string | null
          coverage_multiplier?: number
          created_at?: string
          id?: string
          month: string
          target_amount: number
          updated_at?: string
          working_days?: number | null
          workspace_id: string
        }
        Update: {
          calling_start_date?: string | null
          coverage_multiplier?: number
          created_at?: string
          id?: string
          month?: string
          target_amount?: number
          updated_at?: string
          working_days?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "monthly_targets_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      numbering_counters: {
        Row: {
          next_number: number
          series: string
          workspace_id: string
          year: number
        }
        Insert: {
          next_number?: number
          series: string
          workspace_id: string
          year: number
        }
        Update: {
          next_number?: number
          series?: string
          workspace_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "numbering_counters_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      packages: {
        Row: {
          billing_type: string
          created_at: string
          id: string
          is_working_price: boolean
          name: string
          price: number
          slug: string
          sort_order: number
          updated_at: string
          workspace_id: string
        }
        Insert: {
          billing_type: string
          created_at?: string
          id?: string
          is_working_price?: boolean
          name: string
          price: number
          slug: string
          sort_order?: number
          updated_at?: string
          workspace_id: string
        }
        Update: {
          billing_type?: string
          created_at?: string
          id?: string
          is_working_price?: boolean
          name?: string
          price?: number
          slug?: string
          sort_order?: number
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "packages_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          invoice_id: string
          method: string | null
          notes: string | null
          paid_at: string
          workspace_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          invoice_id: string
          method?: string | null
          notes?: string | null
          paid_at?: string
          workspace_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          invoice_id?: string
          method?: string | null
          notes?: string | null
          paid_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          profile_completed: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string
          id: string
          profile_completed?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          profile_completed?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      project_phases: {
        Row: {
          created_at: string
          id: string
          name: string
          project_id: string
          sort_order: number
          status: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          project_id: string
          sort_order?: number
          status?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          project_id?: string
          sort_order?: number
          status?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_phases_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_phases_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      project_template_phases: {
        Row: {
          id: string
          name: string
          sort_order: number
          template_id: string
        }
        Insert: {
          id?: string
          name: string
          sort_order?: number
          template_id: string
        }
        Update: {
          id?: string
          name?: string
          sort_order?: number
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_template_phases_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "project_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      project_templates: {
        Row: {
          created_at: string
          id: string
          is_default: boolean
          name: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean
          name: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean
          name?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_templates_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          account_id: string
          created_at: string
          deal_id: string | null
          id: string
          name: string
          owner_id: string | null
          status: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          account_id: string
          created_at?: string
          deal_id?: string | null
          id?: string
          name: string
          owner_id?: string | null
          status?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          account_id?: string
          created_at?: string
          deal_id?: string | null
          id?: string
          name?: string
          owner_id?: string | null
          status?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: true
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_line_items: {
        Row: {
          description: string
          id: string
          package_id: string | null
          quantity: number
          quote_id: string
          sort_order: number
          unit_price: number
        }
        Insert: {
          description: string
          id?: string
          package_id?: string | null
          quantity?: number
          quote_id: string
          sort_order?: number
          unit_price: number
        }
        Update: {
          description?: string
          id?: string
          package_id?: string | null
          quantity?: number
          quote_id?: string
          sort_order?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "quote_line_items_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_line_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          account_id: string
          created_at: string
          deal_id: string | null
          expiry_date: string | null
          id: string
          issue_date: string
          notes: string | null
          quote_number: string
          status: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          account_id: string
          created_at?: string
          deal_id?: string | null
          expiry_date?: string | null
          id?: string
          issue_date?: string
          notes?: string | null
          quote_number: string
          status?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          account_id?: string
          created_at?: string
          deal_id?: string | null
          expiry_date?: string | null
          id?: string
          issue_date?: string
          notes?: string | null
          quote_number?: string
          status?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotes_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limit_hits: {
        Row: {
          bucket_key: string
          created_at: string
          id: number
        }
        Insert: {
          bucket_key: string
          created_at?: string
          id?: never
        }
        Update: {
          bucket_key?: string
          created_at?: string
          id?: never
        }
        Relationships: []
      }
      resource_allocations: {
        Row: {
          allocated_hours: number
          created_at: string
          id: string
          project_id: string
          updated_at: string
          user_id: string
          week_start: string
          workspace_id: string
        }
        Insert: {
          allocated_hours?: number
          created_at?: string
          id?: string
          project_id: string
          updated_at?: string
          user_id: string
          week_start: string
          workspace_id: string
        }
        Update: {
          allocated_hours?: number
          created_at?: string
          id?: string
          project_id?: string
          updated_at?: string
          user_id?: string
          week_start?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_allocations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_allocations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      task_assignees: {
        Row: {
          assigned_at: string
          task_id: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          assigned_at?: string
          task_id: string
          user_id: string
          workspace_id: string
        }
        Update: {
          assigned_at?: string
          task_id?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_assignees_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_assignees_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          phase_id: string
          priority: string
          project_id: string
          status: string
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          phase_id: string
          priority?: string
          project_id: string
          status?: string
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          phase_id?: string
          priority?: string
          project_id?: string
          status?: string
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "project_phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
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
      weekly_reviews: {
        Row: {
          calling_block_kept: boolean | null
          created_at: string
          id: string
          next_week_notes: string | null
          question_1: string | null
          question_2: string | null
          question_3: string | null
          updated_at: string
          user_id: string
          week_ending: string
          workspace_id: string
        }
        Insert: {
          calling_block_kept?: boolean | null
          created_at?: string
          id?: string
          next_week_notes?: string | null
          question_1?: string | null
          question_2?: string | null
          question_3?: string | null
          updated_at?: string
          user_id: string
          week_ending: string
          workspace_id: string
        }
        Update: {
          calling_block_kept?: boolean | null
          created_at?: string
          id?: string
          next_week_notes?: string | null
          question_1?: string | null
          question_2?: string | null
          question_3?: string | null
          updated_at?: string
          user_id?: string
          week_ending?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_reviews_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          client_account_id: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          role: Database["public"]["Enums"]["workspace_role"]
          token: string
          workspace_id: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          client_account_id?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          role: Database["public"]["Enums"]["workspace_role"]
          token?: string
          workspace_id: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          client_account_id?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["workspace_role"]
          token?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_invitations_client_account_id_fkey"
            columns: ["client_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_invitations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_members: {
        Row: {
          client_account_id: string | null
          created_at: string
          id: string
          role: Database["public"]["Enums"]["workspace_role"]
          user_id: string
          workspace_id: string
        }
        Insert: {
          client_account_id?: string | null
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["workspace_role"]
          user_id: string
          workspace_id: string
        }
        Update: {
          client_account_id?: string | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["workspace_role"]
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_client_account_id_fkey"
            columns: ["client_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
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
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_workspace_invitation: {
        Args: { p_token: string }
        Returns: string
      }
      can_view_account: {
        Args: { _account_id: string; _user_id: string; _workspace_id: string }
        Returns: boolean
      }
      client_account_id_for: {
        Args: { _user_id: string; _workspace_id: string }
        Returns: string
      }
      get_invitation_preview: {
        Args: { p_token: string }
        Returns: {
          email: string
          is_accepted: boolean
          is_expired: boolean
          role: Database["public"]["Enums"]["workspace_role"]
          workspace_name: string
        }[]
      }
      has_workspace_role: {
        Args: {
          _role: Database["public"]["Enums"]["workspace_role"]
          _user_id: string
          _workspace_id: string
        }
        Returns: boolean
      }
      is_client_role: {
        Args: { _user_id: string; _workspace_id: string }
        Returns: boolean
      }
      is_workspace_member: {
        Args: { _user_id: string; _workspace_id: string }
        Returns: boolean
      }
      log_audit_event: {
        Args: {
          _action: string
          _metadata?: Json
          _resource_id?: string
          _resource_table: string
        }
        Returns: undefined
      }
      next_document_number: {
        Args: { p_series: string; p_workspace_id: string }
        Returns: string
      }
      prune_rate_limit_hits: {
        Args: { p_older_than?: string }
        Returns: undefined
      }
      recompute_invoice_paid_status: {
        Args: { p_invoice_id: string }
        Returns: undefined
      }
      recompute_phase_and_project_status: {
        Args: { p_phase_id: string }
        Returns: undefined
      }
    }
    Enums: {
      workspace_role: "owner" | "admin" | "sales" | "pm" | "member" | "client"
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
      workspace_role: ["owner", "admin", "sales", "pm", "member", "client"],
    },
  },
} as const
