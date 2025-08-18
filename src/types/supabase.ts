export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
      }
      user_companies: {
        Row: {
          user_id: string
          company_id: string
          created_at: string
        }
        Insert: {
          user_id: string
          company_id: string
          created_at?: string
        }
        Update: {
          user_id?: string
          company_id?: string
          created_at?: string
        }
      }
      folders: {
        Row: {
          id: string
          name: string
          company_id: string
          created_at: string
          created_by: string
        }
        Insert: {
          id?: string
          name: string
          company_id: string
          created_at?: string
          created_by: string
        }
        Update: {
          id?: string
          name?: string
          company_id?: string
          created_at?: string
          created_by?: string
        }
      }
      files: {
        Row: {
          id: string
          name: string
          type: string
          size: number
          url: string
          path: string
          folder_id: string | null
          company_id: string
          created_at: string
          created_by: string
          document_date: string
          year: string
          month: string
          amount: number | null
          expense_id: string | null
          budget_id: string | null
          expense_category_id: string | null
        }
        Insert: {
          id?: string
          name: string
          type: string
          size: number
          url: string
          path: string
          folder_id?: string | null
          company_id: string
          created_at?: string
          created_by: string
          document_date: string
          year: string
          month: string
          amount?: number | null
          expense_id?: string | null
          budget_id?: string | null
          expense_category_id?: string | null
        }
        Update: {
          id?: string
          name?: string
          type?: string
          size?: number
          url?: string
          path?: string
          folder_id?: string | null
          company_id?: string
          created_at?: string
          created_by?: string
          document_date?: string
          year?: string
          month?: string
          amount?: number | null
          expense_id?: string | null
          budget_id?: string | null
          expense_category_id?: string | null
        }
      }
      folder_shares: {
        Row: {
          id: string
          folder_id: string
          user_id: string
          role: 'viewer' | 'editor'
          created_at: string
        }
        Insert: {
          id?: string
          folder_id: string
          user_id: string
          role: 'viewer' | 'editor'
          created_at?: string
        }
        Update: {
          id?: string
          folder_id?: string
          user_id?: string
          role?: 'viewer' | 'editor'
          created_at?: string
        }
      }
      expense_categories: {
        Row: {
          id: string
          company_id: string
          name: string
          description: string | null
          color: string
          is_active: boolean
          created_at: string
          updated_at: string
          created_by: string
        }
        Insert: {
          id?: string
          company_id: string
          name: string
          description?: string | null
          color?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
          created_by: string
        }
        Update: {
          id?: string
          company_id?: string
          name?: string
          description?: string | null
          color?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string
        }
      }
      budgets: {
        Row: {
          id: string
          company_id: string
          name: string
          description: string | null
          initial_amount: number
          spent_amount: number
          remaining_amount: number
          start_date: string | null
          end_date: string | null
          is_active: boolean
          created_at: string
          updated_at: string
          created_by: string
        }
        Insert: {
          id?: string
          company_id: string
          name: string
          description?: string | null
          initial_amount: number
          spent_amount?: number
          start_date?: string | null
          end_date?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
          created_by: string
        }
        Update: {
          id?: string
          company_id?: string
          name?: string
          description?: string | null
          initial_amount?: number
          spent_amount?: number
          start_date?: string | null
          end_date?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string
        }
      }
      expenses: {
        Row: {
          id: string
          company_id: string
          budget_id: string | null
          expense_category_id: string | null
          file_id: string | null
          title: string
          description: string | null
          amount: number
          expense_date: string
          vendor: string | null
          reference_number: string | null
          payment_method: 'cash' | 'check' | 'bank_transfer' | 'card' | 'other' | null
          is_recurring: boolean
          tags: string[] | null
          status: 'pending' | 'approved' | 'paid' | 'cancelled'
          created_at: string
          updated_at: string
          created_by: string
        }
        Insert: {
          id?: string
          company_id: string
          budget_id?: string | null
          expense_category_id?: string | null
          file_id?: string | null
          title: string
          description?: string | null
          amount: number
          expense_date?: string
          vendor?: string | null
          reference_number?: string | null
          payment_method?: 'cash' | 'check' | 'bank_transfer' | 'card' | 'other' | null
          is_recurring?: boolean
          tags?: string[] | null
          status?: 'pending' | 'approved' | 'paid' | 'cancelled'
          created_at?: string
          updated_at?: string
          created_by: string
        }
        Update: {
          id?: string
          company_id?: string
          budget_id?: string | null
          expense_category_id?: string | null
          file_id?: string | null
          title?: string
          description?: string | null
          amount?: number
          expense_date?: string
          vendor?: string | null
          reference_number?: string | null
          payment_method?: 'cash' | 'check' | 'bank_transfer' | 'card' | 'other' | null
          is_recurring?: boolean
          tags?: string[] | null
          status?: 'pending' | 'approved' | 'paid' | 'cancelled'
          created_at?: string
          updated_at?: string
          created_by?: string
        }
      }
    }
  }
}