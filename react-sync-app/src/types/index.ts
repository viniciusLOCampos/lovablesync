// Tipos para configurações de sincronização
export interface SyncConfig {
  id: string
  name: string
  source_path: string
  target_repo: string
  target_branch: string
  github_token: string | null
  auto_sync: boolean
  sync_interval: number
  last_sync: string | null
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

export interface CreateSyncConfig {
  name: string
  source_path: string
  target_repo: string
  target_branch?: string
  github_token?: string | null
  auto_sync?: boolean
  sync_interval?: number
}

export interface UpdateSyncConfig {
  name?: string
  source_path?: string
  target_repo?: string
  target_branch?: string
  github_token?: string | null
  auto_sync?: boolean
  sync_interval?: number
  status?: 'active' | 'inactive'
}

// Tipos para logs de sincronização
export type SyncStatus = 'success' | 'error' | 'in_progress'

export interface SyncLog {
  id: string
  config_id: string
  status: SyncStatus
  message: string
  details: string | null
  files_changed: number
  created_at: string
}

export interface CreateSyncLog {
  config_id: string
  status: SyncStatus
  message: string
  details?: string | null
  files_changed?: number
}

// Tipos para operações de sincronização
export interface SyncProgress {
  configId: string
  configName: string
  status: SyncStatus
  currentStep: 'deleting' | 'copying' | 'completed' | 'error'
  filesProcessed: number
  totalFiles: number
  message: string
}

export interface SyncResult {
  success: boolean
  filesProcessed: number
  error?: string
  duration: number
}

// Tipos para autenticação GitHub
export interface GitHubAuth {
  token: string
  username?: string
}

// Tipos para repositórios GitHub
export interface GitHubRepo {
  id: number
  owner: string
  name: string
  full_name: string
  private: boolean
}

export interface GitHubFile {
  name: string
  path: string
  type: 'file' | 'dir'
  size?: number
  sha?: string
  content?: string
}

// Tipos para componentes
export interface SyncConfigFormData {
  name: string
  sourcePath: string
  targetRepo: string
  targetBranch: string
  autoSync: boolean
}

export interface ProgressBarProps {
  progress: number
  status: SyncStatus
  message?: string
}

// Tipos para contexto da aplicação
export interface AppContextType {
  configs: SyncConfig[]
  logs: SyncLog[]
  syncProgress: SyncProgress[]
  githubToken: string | null
  isLoading: boolean
  error: string | null
  
  // Actions
  setGitHubToken: (token: string) => void
  addConfig: (config: CreateSyncConfig) => Promise<void>
  updateConfig: (id: string, config: UpdateSyncConfig) => Promise<void>
  deleteConfig: (id: string) => Promise<void>
  syncAll: () => Promise<void>
  syncSingle: (configId: string) => Promise<void>
  loadConfigs: () => Promise<void>
  loadLogs: () => Promise<void>
}