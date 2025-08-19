import { supabase } from '../lib/supabase'
import type { SyncConfig, CreateSyncConfig, UpdateSyncConfig, SyncLog, CreateSyncLog } from '../types'

class SupabaseService {
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
          source_repo: config.source_repo,
          target_repo: config.target_repo,
          enabled: config.enabled ?? true
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
    try {
      const updateData: Record<string, string | boolean> = {
        updated_at: new Date().toISOString()
      }
      
      if (config.name !== undefined) updateData.name = config.name
      if (config.source_repo !== undefined) updateData.source_repo = config.source_repo
      if (config.target_repo !== undefined) updateData.target_repo = config.target_repo
      if (config.enabled !== undefined) updateData.enabled = config.enabled
      
      const { data, error } = await supabase
        .from('sync_configs')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()
      
      if (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      throw new Error(`Erro ao atualizar configuração: ${errorMessage}`)
      }
      
      return data
    } catch (error: unknown) {
      console.error('Erro ao atualizar configuração:', error)
      throw error
    }
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
          files_processed: log.files_processed ?? 0
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
        .eq('enabled', true)
      
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