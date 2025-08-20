import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      sync_configs: {
        Row: {
          id: string
          name: string
          source_path: string
          target_repo: string
          target_branch: string
          github_token: string | null
          auto_sync: boolean
          sync_interval: number
          last_sync: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          source_path: string
          target_repo: string
          target_branch?: string
          github_token?: string | null
          auto_sync?: boolean
          sync_interval?: number
          last_sync?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          source_path?: string
          target_repo?: string
          target_branch?: string
          github_token?: string | null
          auto_sync?: boolean
          sync_interval?: number
          last_sync?: string | null
          status?: string
          updated_at?: string
        }
      }
      sync_logs: {
        Row: {
          id: string
          config_id: string
          status: 'success' | 'error' | 'in_progress'
          message: string
          details: string | null
          files_changed: number
          created_at: string
        }
        Insert: {
          id?: string
          config_id: string
          status: 'success' | 'error' | 'in_progress'
          message: string
          details?: string | null
          files_changed?: number
          created_at?: string
        }
        Update: {
          id?: string
          config_id?: string
          status?: 'success' | 'error' | 'in_progress'
          message?: string
          details?: string | null
          files_changed?: number
        }
      }
    }
  }
}