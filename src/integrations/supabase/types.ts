// Hand-written for Phase 0. Once a real Supabase project exists and the
// migrations in supabase/migrations/ are applied, regenerate this file with
// `supabase gen types typescript` and replace this stub entirely.

export type WorkspaceRole = "owner" | "admin" | "sales" | "pm" | "member" | "client";
export type DealStatus = "open" | "won" | "lost" | "later";
export type PackageBillingType = "one_off" | "recurring";
export type ProjectStatus = "active" | "on_hold" | "completed";
export type ProjectPhaseStatus = "not_started" | "in_progress" | "done";
export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "normal" | "high";
export type QuoteStatus = "draft" | "sent" | "accepted" | "declined" | "expired";
export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "void";
export type DocumentSeries = "quote" | "invoice";

export interface Database {
  public: {
    Tables: {
      workspaces: {
        Row: {
          id: string;
          name: string;
          slug: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      workspace_members: {
        Row: {
          id: string;
          workspace_id: string;
          user_id: string;
          role: WorkspaceRole;
          client_account_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          user_id: string;
          role: WorkspaceRole;
          client_account_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          user_id?: string;
          role?: WorkspaceRole;
          client_account_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workspace_members_client_account_id_fkey";
            columns: ["client_account_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      industries: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          slug: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          name: string;
          slug: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          name?: string;
          slug?: string;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "industries_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      packages: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          slug: string;
          billing_type: PackageBillingType;
          price: number;
          is_working_price: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          name: string;
          slug: string;
          billing_type: PackageBillingType;
          price: number;
          is_working_price?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          name?: string;
          slug?: string;
          billing_type?: PackageBillingType;
          price?: number;
          is_working_price?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "packages_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      accounts: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          industry_id: string | null;
          website: string | null;
          country: string | null;
          is_reference_client: boolean;
          reference_note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          name: string;
          industry_id?: string | null;
          website?: string | null;
          country?: string | null;
          is_reference_client?: boolean;
          reference_note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          name?: string;
          industry_id?: string | null;
          website?: string | null;
          country?: string | null;
          is_reference_client?: boolean;
          reference_note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "accounts_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "accounts_industry_id_fkey";
            columns: ["industry_id"];
            isOneToOne: false;
            referencedRelation: "industries";
            referencedColumns: ["id"];
          },
        ];
      };
      contacts: {
        Row: {
          id: string;
          workspace_id: string;
          account_id: string;
          name: string;
          email: string | null;
          phone: string | null;
          role_title: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          account_id: string;
          name: string;
          email?: string | null;
          phone?: string | null;
          role_title?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          account_id?: string;
          name?: string;
          email?: string | null;
          phone?: string | null;
          role_title?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "contacts_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "contacts_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
        ];
      };
      deals: {
        Row: {
          id: string;
          workspace_id: string;
          account_id: string;
          industry_id: string | null;
          package_id: string | null;
          owner_id: string | null;
          value: number;
          status: DealStatus;
          next_step: string | null;
          next_date: string | null;
          won_at: string | null;
          invoiced_at: string | null;
          referral_ask_logged: boolean;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          account_id: string;
          industry_id?: string | null;
          package_id?: string | null;
          owner_id?: string | null;
          value: number;
          status?: DealStatus;
          next_step?: string | null;
          next_date?: string | null;
          won_at?: string | null;
          invoiced_at?: string | null;
          referral_ask_logged?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          account_id?: string;
          industry_id?: string | null;
          package_id?: string | null;
          owner_id?: string | null;
          value?: number;
          status?: DealStatus;
          next_step?: string | null;
          next_date?: string | null;
          won_at?: string | null;
          invoiced_at?: string | null;
          referral_ask_logged?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "deals_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "deals_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "deals_industry_id_fkey";
            columns: ["industry_id"];
            isOneToOne: false;
            referencedRelation: "industries";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "deals_package_id_fkey";
            columns: ["package_id"];
            isOneToOne: false;
            referencedRelation: "packages";
            referencedColumns: ["id"];
          },
        ];
      };
      monthly_targets: {
        Row: {
          id: string;
          workspace_id: string;
          month: string;
          target_amount: number;
          working_days: number | null;
          calling_start_date: string | null;
          coverage_multiplier: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          month: string;
          target_amount: number;
          working_days?: number | null;
          calling_start_date?: string | null;
          coverage_multiplier?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          month?: string;
          target_amount?: number;
          working_days?: number | null;
          calling_start_date?: string | null;
          coverage_multiplier?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "monthly_targets_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      monthly_plan_lines: {
        Row: {
          id: string;
          workspace_id: string;
          month: string;
          package_id: string;
          planned_units: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          month: string;
          package_id: string;
          planned_units?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          month?: string;
          package_id?: string;
          planned_units?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "monthly_plan_lines_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "monthly_plan_lines_package_id_fkey";
            columns: ["package_id"];
            isOneToOne: false;
            referencedRelation: "packages";
            referencedColumns: ["id"];
          },
        ];
      };
      daily_activity_log: {
        Row: {
          id: string;
          workspace_id: string;
          user_id: string;
          log_date: string;
          industry_focus_id: string | null;
          touches: number;
          conversations: number;
          meetings_booked: number;
          meetings_held: number;
          offers_sent: number;
          wins: number;
          hours_calling: number;
          notes_for_tomorrow: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          user_id: string;
          log_date: string;
          industry_focus_id?: string | null;
          touches?: number;
          conversations?: number;
          meetings_booked?: number;
          meetings_held?: number;
          offers_sent?: number;
          wins?: number;
          hours_calling?: number;
          notes_for_tomorrow?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          user_id?: string;
          log_date?: string;
          industry_focus_id?: string | null;
          touches?: number;
          conversations?: number;
          meetings_booked?: number;
          meetings_held?: number;
          offers_sent?: number;
          wins?: number;
          hours_calling?: number;
          notes_for_tomorrow?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "daily_activity_log_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "daily_activity_log_industry_focus_id_fkey";
            columns: ["industry_focus_id"];
            isOneToOne: false;
            referencedRelation: "industries";
            referencedColumns: ["id"];
          },
        ];
      };
      weekly_reviews: {
        Row: {
          id: string;
          workspace_id: string;
          user_id: string;
          week_ending: string;
          question_1: string | null;
          question_2: string | null;
          question_3: string | null;
          calling_block_kept: boolean | null;
          next_week_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          user_id: string;
          week_ending: string;
          question_1?: string | null;
          question_2?: string | null;
          question_3?: string | null;
          calling_block_kept?: boolean | null;
          next_week_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          user_id?: string;
          week_ending?: string;
          question_1?: string | null;
          question_2?: string | null;
          question_3?: string | null;
          calling_block_kept?: boolean | null;
          next_week_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "weekly_reviews_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      industry_playbooks: {
        Row: {
          id: string;
          workspace_id: string;
          industry_id: string;
          opening_line: string;
          questions: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          industry_id: string;
          opening_line: string;
          questions?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          industry_id?: string;
          opening_line?: string;
          questions?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "industry_playbooks_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "industry_playbooks_industry_id_fkey";
            columns: ["industry_id"];
            isOneToOne: false;
            referencedRelation: "industries";
            referencedColumns: ["id"];
          },
        ];
      };
      project_templates: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          is_default: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          name: string;
          is_default?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          name?: string;
          is_default?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "project_templates_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      project_template_phases: {
        Row: {
          id: string;
          template_id: string;
          name: string;
          sort_order: number;
        };
        Insert: {
          id?: string;
          template_id: string;
          name: string;
          sort_order?: number;
        };
        Update: {
          id?: string;
          template_id?: string;
          name?: string;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: "project_template_phases_template_id_fkey";
            columns: ["template_id"];
            isOneToOne: false;
            referencedRelation: "project_templates";
            referencedColumns: ["id"];
          },
        ];
      };
      projects: {
        Row: {
          id: string;
          workspace_id: string;
          account_id: string;
          deal_id: string | null;
          name: string;
          status: ProjectStatus;
          owner_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          account_id: string;
          deal_id?: string | null;
          name: string;
          status?: ProjectStatus;
          owner_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          account_id?: string;
          deal_id?: string | null;
          name?: string;
          status?: ProjectStatus;
          owner_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "projects_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "projects_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "projects_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: true;
            referencedRelation: "deals";
            referencedColumns: ["id"];
          },
        ];
      };
      project_phases: {
        Row: {
          id: string;
          workspace_id: string;
          project_id: string;
          name: string;
          sort_order: number;
          status: ProjectPhaseStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          project_id: string;
          name: string;
          sort_order?: number;
          status?: ProjectPhaseStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          project_id?: string;
          name?: string;
          sort_order?: number;
          status?: ProjectPhaseStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "project_phases_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "project_phases_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      deal_handoffs: {
        Row: {
          id: string;
          workspace_id: string;
          deal_id: string;
          project_id: string | null;
          scope: string | null;
          logins_note: string | null;
          signed_document_url: string | null;
          handed_off_by: string | null;
          handed_off_at: string;
          acknowledged_by: string | null;
          acknowledged_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          deal_id: string;
          project_id?: string | null;
          scope?: string | null;
          logins_note?: string | null;
          signed_document_url?: string | null;
          handed_off_by?: string | null;
          handed_off_at?: string;
          acknowledged_by?: string | null;
          acknowledged_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          deal_id?: string;
          project_id?: string | null;
          scope?: string | null;
          logins_note?: string | null;
          signed_document_url?: string | null;
          handed_off_by?: string | null;
          handed_off_at?: string;
          acknowledged_by?: string | null;
          acknowledged_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "deal_handoffs_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "deal_handoffs_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: true;
            referencedRelation: "deals";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "deal_handoffs_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      tasks: {
        Row: {
          id: string;
          workspace_id: string;
          project_id: string;
          phase_id: string;
          title: string;
          description: string | null;
          status: TaskStatus;
          priority: TaskPriority;
          due_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          project_id: string;
          phase_id: string;
          title: string;
          description?: string | null;
          status?: TaskStatus;
          priority?: TaskPriority;
          due_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          project_id?: string;
          phase_id?: string;
          title?: string;
          description?: string | null;
          status?: TaskStatus;
          priority?: TaskPriority;
          due_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tasks_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tasks_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tasks_phase_id_fkey";
            columns: ["phase_id"];
            isOneToOne: false;
            referencedRelation: "project_phases";
            referencedColumns: ["id"];
          },
        ];
      };
      task_assignees: {
        Row: {
          task_id: string;
          user_id: string;
          workspace_id: string;
          assigned_at: string;
        };
        Insert: {
          task_id: string;
          user_id: string;
          workspace_id: string;
          assigned_at?: string;
        };
        Update: {
          task_id?: string;
          user_id?: string;
          workspace_id?: string;
          assigned_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "task_assignees_task_id_fkey";
            columns: ["task_id"];
            isOneToOne: false;
            referencedRelation: "tasks";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "task_assignees_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      resource_allocations: {
        Row: {
          id: string;
          workspace_id: string;
          user_id: string;
          project_id: string;
          week_start: string;
          allocated_hours: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          user_id: string;
          project_id: string;
          week_start: string;
          allocated_hours?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          user_id?: string;
          project_id?: string;
          week_start?: string;
          allocated_hours?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "resource_allocations_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "resource_allocations_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      numbering_counters: {
        Row: { workspace_id: string; series: DocumentSeries; year: number; next_number: number };
        Insert: {
          workspace_id: string;
          series: DocumentSeries;
          year: number;
          next_number?: number;
        };
        Update: {
          workspace_id?: string;
          series?: DocumentSeries;
          year?: number;
          next_number?: number;
        };
        Relationships: [
          {
            foreignKeyName: "numbering_counters_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      quotes: {
        Row: {
          id: string;
          workspace_id: string;
          account_id: string;
          deal_id: string | null;
          quote_number: string;
          status: QuoteStatus;
          issue_date: string;
          expiry_date: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          account_id: string;
          deal_id?: string | null;
          quote_number: string;
          status?: QuoteStatus;
          issue_date?: string;
          expiry_date?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          account_id?: string;
          deal_id?: string | null;
          quote_number?: string;
          status?: QuoteStatus;
          issue_date?: string;
          expiry_date?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "quotes_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "quotes_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
        ];
      };
      quote_line_items: {
        Row: {
          id: string;
          quote_id: string;
          package_id: string | null;
          description: string;
          quantity: number;
          unit_price: number;
          sort_order: number;
        };
        Insert: {
          id?: string;
          quote_id: string;
          package_id?: string | null;
          description: string;
          quantity?: number;
          unit_price: number;
          sort_order?: number;
        };
        Update: {
          id?: string;
          quote_id?: string;
          package_id?: string | null;
          description?: string;
          quantity?: number;
          unit_price?: number;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: "quote_line_items_quote_id_fkey";
            columns: ["quote_id"];
            isOneToOne: false;
            referencedRelation: "quotes";
            referencedColumns: ["id"];
          },
        ];
      };
      invoices: {
        Row: {
          id: string;
          workspace_id: string;
          account_id: string;
          deal_id: string | null;
          project_id: string | null;
          quote_id: string | null;
          invoice_number: string;
          status: InvoiceStatus;
          issue_date: string;
          due_date: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          account_id: string;
          deal_id?: string | null;
          project_id?: string | null;
          quote_id?: string | null;
          invoice_number: string;
          status?: InvoiceStatus;
          issue_date?: string;
          due_date?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          account_id?: string;
          deal_id?: string | null;
          project_id?: string | null;
          quote_id?: string | null;
          invoice_number?: string;
          status?: InvoiceStatus;
          issue_date?: string;
          due_date?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "invoices_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invoices_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invoices_quote_id_fkey";
            columns: ["quote_id"];
            isOneToOne: false;
            referencedRelation: "quotes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invoices_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      invoice_line_items: {
        Row: {
          id: string;
          invoice_id: string;
          package_id: string | null;
          description: string;
          quantity: number;
          unit_price: number;
          sort_order: number;
        };
        Insert: {
          id?: string;
          invoice_id: string;
          package_id?: string | null;
          description: string;
          quantity?: number;
          unit_price: number;
          sort_order?: number;
        };
        Update: {
          id?: string;
          invoice_id?: string;
          package_id?: string | null;
          description?: string;
          quantity?: number;
          unit_price?: number;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: "invoice_line_items_invoice_id_fkey";
            columns: ["invoice_id"];
            isOneToOne: false;
            referencedRelation: "invoices";
            referencedColumns: ["id"];
          },
        ];
      };
      payments: {
        Row: {
          id: string;
          workspace_id: string;
          invoice_id: string;
          amount: number;
          paid_at: string;
          method: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          invoice_id: string;
          amount: number;
          paid_at?: string;
          method?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          invoice_id?: string;
          amount?: number;
          paid_at?: string;
          method?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payments_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payments_invoice_id_fkey";
            columns: ["invoice_id"];
            isOneToOne: false;
            referencedRelation: "invoices";
            referencedColumns: ["id"];
          },
        ];
      };
      audit_log: {
        Row: {
          id: string;
          actor_id: string | null;
          action: string;
          resource_table: string;
          resource_id: string | null;
          metadata: Record<string, unknown>;
          ip: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_id?: string | null;
          action: string;
          resource_table: string;
          resource_id?: string | null;
          metadata?: Record<string, unknown>;
          ip?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          actor_id?: string | null;
          action?: string;
          resource_table?: string;
          resource_id?: string | null;
          metadata?: Record<string, unknown>;
          ip?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      rate_limit_hits: {
        Row: { id: number; bucket_key: string; created_at: string };
        Insert: { id?: number; bucket_key: string; created_at?: string };
        Update: { id?: number; bucket_key?: string; created_at?: string };
        Relationships: [];
      };
      workspace_invitations: {
        Row: {
          id: string;
          workspace_id: string;
          email: string;
          role: WorkspaceRole;
          client_account_id: string | null;
          token: string;
          invited_by: string | null;
          created_at: string;
          expires_at: string;
          accepted_at: string | null;
          accepted_by: string | null;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          email: string;
          role: WorkspaceRole;
          client_account_id?: string | null;
          token?: string;
          invited_by?: string | null;
          created_at?: string;
          expires_at?: string;
          accepted_at?: string | null;
          accepted_by?: string | null;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          email?: string;
          role?: WorkspaceRole;
          client_account_id?: string | null;
          token?: string;
          invited_by?: string | null;
          created_at?: string;
          expires_at?: string;
          accepted_at?: string | null;
          accepted_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "workspace_invitations_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workspace_invitations_client_account_id_fkey";
            columns: ["client_account_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      has_workspace_role: {
        Args: { _user_id: string; _workspace_id: string; _role: WorkspaceRole };
        Returns: boolean;
      };
      is_workspace_member: {
        Args: { _user_id: string; _workspace_id: string };
        Returns: boolean;
      };
      next_document_number: {
        Args: { p_workspace_id: string; p_series: DocumentSeries };
        Returns: string;
      };
      log_audit_event: {
        Args: {
          _action: string;
          _resource_table: string;
          _resource_id?: string | null;
          _metadata?: Record<string, unknown>;
        };
        Returns: undefined;
      };
      accept_workspace_invitation: {
        Args: { p_token: string };
        Returns: string;
      };
      get_invitation_preview: {
        Args: { p_token: string };
        Returns: {
          workspace_name: string;
          role: WorkspaceRole;
          email: string;
          is_expired: boolean;
          is_accepted: boolean;
        }[];
      };
    };
    Enums: {
      workspace_role: WorkspaceRole;
    };
  };
}
