import { supabase } from '../lib/supabase'
import type { SyncConfig, CreateSyncConfig, UpdateSyncConfig, SyncLog, CreateSyncLog } from '../types'

class SupabaseService {
  // Função helper para retry de operações
  private async retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Erro desconhecido')

        if (attempt === maxRetries) {
          throw lastError
        }

        console.warn(`Tentativa ${attempt} falhou, tentando novamente em ${delay}ms:`, lastError.message)
        await new Promise(resolve => setTimeout(resolve, delay))
        delay *= 2 // Backoff exponencial
      }
    }

    throw lastError!
  }
  /**
   * Obtém todas as configurações de sincronização
   */
  async getConfigs(): Promise<SyncConfig[]> {
    try {
      const { data, error } = await supabase
        .from('sync_configs')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
        throw new Error(`Erro ao buscar configurações: ${errorMessage}`)
      }

      return data || []
    } catch (error: unknown) {
      console.error('Erro ao obter configurações:', error)
      throw error
    }
  }

  /**
   * Cria uma nova configuração de sincronização
   */
  async createConfig(config: CreateSyncConfig): Promise<SyncConfig> {
    try {
      const { data, error } = await supabase
        .from('sync_configs')
        .insert({
          name: config.name,
          source_path: config.source_path,
          target_repo: config.target_repo,
          target_branch: config.target_branch ?? 'main',
          github_token: config.github_token ?? null,
          auto_sync: config.auto_sync ?? true,
          use_gitignore: config.use_gitignore ?? true,
          sync_interval: config.sync_interval ?? 300,
          status: 'active'
        })
        .select()
        .single()

      if (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
        throw new Error(`Erro ao criar configuração: ${errorMessage}`)
      }

      return data
    } catch (error: unknown) {
      console.error('Erro ao criar configuração:', error)
      throw error
    }
  }

  /**
   * Atualiza uma configuração existente
   */
  async updateConfig(id: string, config: UpdateSyncConfig): Promise<SyncConfig> {
    // Validar entrada
    if (!id || typeof id !== 'string') {
      throw new Error('ID da configuração é obrigatório')
    }

    if (!config || Object.keys(config).length === 0) {
      throw new Error('Dados de configuração são obrigatórios')
    }

    return this.retryOperation(async () => {
      // Verificar colunas disponíveis dinamicamente
      const availableColumns = await this.getTableColumns('sync_configs')
      console.log('Colunas disponíveis na tabela sync_configs:', availableColumns)

      const updateData: Record<string, string | number | boolean | null> = {
        updated_at: new Date().toISOString()
      }

      // Só adicionar campos que existem na tabela
      if (config.name !== undefined && availableColumns.includes('name')) {
        updateData.name = config.name
      }
      if (config.source_path !== undefined && availableColumns.includes('source_path')) {
        updateData.source_path = config.source_path
      }
      if (config.target_repo !== undefined && availableColumns.includes('target_repo')) {
        updateData.target_repo = config.target_repo
      }
      if (config.target_branch !== undefined && availableColumns.includes('target_branch')) {
        updateData.target_branch = config.target_branch
      }
      if (config.github_token !== undefined && availableColumns.includes('github_token')) {
        updateData.github_token = config.github_token
      }
      if (config.auto_sync !== undefined && availableColumns.includes('auto_sync')) {
        updateData.auto_sync = config.auto_sync
      }
      if (config.use_gitignore !== undefined && availableColumns.includes('use_gitignore')) {
        updateData.use_gitignore = config.use_gitignore
      }
      if (config.sync_interval !== undefined && availableColumns.includes('sync_interval')) {
        updateData.sync_interval = config.sync_interval
      }
      if (config.status !== undefined && availableColumns.includes('status')) {
        updateData.status = config.status
      }

      console.log('Dados para atualização (após verificação de schema):', updateData)

      const { data, error } = await supabase
        .from('sync_configs')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Erro do Supabase ao atualizar configuração:', {
          error,
          id,
          updateData,
          code: error.code,
          message: error.message,
          details: error.details
        })

        // Tratar diferentes tipos de erro
        if (error.code === 'PGRST116') {
          throw new Error('Configuração não encontrada')
        }

        if (error.code === '23505') {
          throw new Error('Nome da configuração já existe')
        }

        const errorMessage = error.message || 'Erro desconhecido ao atualizar configuração'
        throw new Error(errorMessage)
      }

      return data
    })
  }

  /**
   * Deleta uma configuração
   */
  async deleteConfig(id: string): Promise<void> {
    try {
      // Primeiro, deletar todos os logs relacionados
      await supabase
        .from('sync_logs')
        .delete()
        .eq('config_id', id)

      // Depois, deletar a configuração
      const { error } = await supabase
        .from('sync_configs')
        .delete()
        .eq('id', id)

      if (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
        throw new Error(`Erro ao deletar configuração: ${errorMessage}`)
      }
    } catch (error: unknown) {
      console.error('Erro ao deletar configuração:', error)
      throw error
    }
  }

  /**
   * Testa conectividade com Supabase
   */
  async testConnection(): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('sync_configs')
        .select('count')
        .limit(1)

      if (error) {
        console.error('Erro de conectividade com Supabase:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Falha ao testar conexão com Supabase:', error)
      return false
    }
  }

  /**
   * Verificar schema da tabela dinamicamente
   */
  private async getTableColumns(tableName: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1)

      if (error) {
        console.error('Erro ao verificar colunas da tabela:', error)
        return []
      }

      return data && data.length > 0 ? Object.keys(data[0]) : []
    } catch (error) {
      console.error('Falha ao verificar schema da tabela:', error)
      return []
    }
  }

  /**
   * Obtém uma configuração específica por ID
   */
  async getConfigById(id: string): Promise<SyncConfig | null> {
    try {
      const { data, error } = await supabase
        .from('sync_configs')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null // Não encontrado
        }
        throw new Error(`Erro ao buscar configuração: ${error.message}`)
      }

      return data
    } catch (error: unknown) {
      console.error('Erro ao obter configuração por ID:', error)
      throw error
    }
  }

  /**
   * Obtém logs de sincronização
   */
  async getLogs(configId?: string, limit: number = 100): Promise<SyncLog[]> {
    try {
      let query = supabase
        .from('sync_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (configId) {
        query = query.eq('config_id', configId)
      }

      const { data, error } = await query

      if (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
        throw new Error(`Erro ao buscar logs: ${errorMessage}`)
      }

      return data || []
    } catch (error: unknown) {
      console.error('Erro ao obter logs:', error)
      throw error
    }
  }

  /**
   * Cria um novo log de sincronização
   */
  async createLog(log: CreateSyncLog): Promise<SyncLog> {
    try {
      const { data, error } = await supabase
        .from('sync_logs')
        .insert({
          config_id: log.config_id,
          status: log.status,
          message: log.message,
          details: log.details ?? null,
          files_changed: log.files_changed ?? 0
        })
        .select()
        .single()

      if (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
        throw new Error(`Erro ao criar log: ${errorMessage}`)
      }

      return data
    } catch (error: unknown) {
      console.error('Erro ao criar log:', error)
      throw error
    }
  }

  /**
   * Limpa logs antigos (mais de 3 dias)
   */
  async cleanOldLogs(): Promise<number> {
    try {
      const threeDaysAgo = new Date()
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

      const { data, error } = await supabase
        .from('sync_logs')
        .delete()
        .lt('created_at', threeDaysAgo.toISOString())
        .select('id')

      if (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
        throw new Error(`Erro ao limpar logs antigos: ${errorMessage}`)
      }

      return data?.length || 0
    } catch (error: unknown) {
      console.error('Erro ao limpar logs antigos:', error)
      throw error
    }
  }

  /**
   * Obtém estatísticas de sincronização
   */
  async getSyncStats(): Promise<{
    totalConfigs: number
    activeConfigs: number
    totalSyncs: number
    successfulSyncs: number
    failedSyncs: number
  }> {
    try {
      // Contar configurações
      const { count: totalConfigs } = await supabase
        .from('sync_configs')
        .select('*', { count: 'exact', head: true })

      const { count: activeConfigs } = await supabase
        .from('sync_configs')
        .select('*', { count: 'exact', head: true })
        .eq('auto_sync', true)

      // Contar logs
      const { count: totalSyncs } = await supabase
        .from('sync_logs')
        .select('*', { count: 'exact', head: true })

      const { count: successfulSyncs } = await supabase
        .from('sync_logs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'success')

      const { count: failedSyncs } = await supabase
        .from('sync_logs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'error')

      return {
        totalConfigs: totalConfigs || 0,
        activeConfigs: activeConfigs || 0,
        totalSyncs: totalSyncs || 0,
        successfulSyncs: successfulSyncs || 0,
        failedSyncs: failedSyncs || 0
      }
    } catch (error: unknown) {
      console.error('Erro ao obter estatísticas:', error)
      throw error
    }
  }

  /**
   * Verifica se um nome de configuração já existe
   */
  async configNameExists(name: string, excludeId?: string): Promise<boolean> {
    try {
      let query = supabase
        .from('sync_configs')
        .select('id')
        .eq('name', name)

      if (excludeId) {
        query = query.neq('id', excludeId)
      }

      const { data, error } = await query

      if (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
        throw new Error(`Erro ao verificar nome: ${errorMessage}`)
      }

      return (data?.length || 0) > 0
    } catch (error: unknown) {
      console.error('Erro ao verificar nome da configuração:', error)
      throw error
    }
  }
}

export const supabaseService = new SupabaseService()
export default supabaseService

