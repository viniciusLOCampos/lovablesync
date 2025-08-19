import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://punhxbvwjvfrhceainka.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1bmh4YnZ3anZmcmhjZWFpbmthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0NTAyMDcsImV4cCI6MjA3MDAyNjIwN30.UtEAXTfBmTg1GcmalxjxgTTXYWIhr4qAZ3bsWqmtDiI'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      sync_configs: {
        Row: {
          id: string
          name: string
          source_repo: string
          target_repo: string
          enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          source_repo: string
          target_repo: string
          enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          source_repo?: string
          target_repo?: string
          enabled?: boolean
          updated_at?: string
        }
      }
      sync_logs: {
        Row: {
          id: string
          config_id: string
          status: 'success' | 'error' | 'in_progress'
          message: string
          files_processed: number
          created_at: string
        }
        Insert: {
          id?: string
          config_id: string
          status: 'success' | 'error' | 'in_progress'
          message: string
          files_processed?: number
          created_at?: string
        }
        Update: {
          id?: string
          config_id?: string
          status?: 'success' | 'error' | 'in_progress'
          message?: string
          files_processed?: number
        }
      }
    }
  }
}