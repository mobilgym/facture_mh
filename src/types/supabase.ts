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
    }
  }
}