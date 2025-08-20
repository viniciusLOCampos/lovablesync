import { useState } from 'react'
import { Play, Pause, Edit, Trash2, Plus, RefreshCw, GitBranch, AlertCircle } from 'lucide-react'
import type { SyncConfig } from '../types'

interface ConfigListProps {
  configs: SyncConfig[]
  onEdit: (config: SyncConfig) => void
  onDelete: (config: SyncConfig) => void
  onSync: (config: SyncConfig) => void
  onToggleEnabled: (config: SyncConfig) => void
  onCreateNew: () => void
  loading?: boolean
  syncingConfigs?: string[]
}

export default function ConfigList({
  configs,
  onEdit,
  onDelete,
  onSync,
  onToggleEnabled,
  onCreateNew,
  loading = false,
  syncingConfigs = []
}: ConfigListProps) {
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const handleDelete = (config: SyncConfig) => {
    if (confirmDelete === config.id) {
      onDelete(config)
      setConfirmDelete(null)
    } else {
      setConfirmDelete(config.id)
      // Auto-cancel confirmation after 3 seconds
      setTimeout(() => setConfirmDelete(null), 3000)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isSyncing = (configId: string) => {
    return syncingConfigs.includes(configId)
  }

  if (loading) {
    return (
      <div className="bg-gray-950/80 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/[0.15] p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.06] via-white/[0.02] to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-tl from-blue-500/[0.10] via-transparent to-indigo-500/[0.06]" />
        <div className="flex items-center justify-center relative z-10">
          <div className="relative mr-6">
            <RefreshCw className="w-12 h-12 text-blue-400 animate-spin" />
            <div className="absolute inset-0 w-12 h-12 bg-blue-500/20 rounded-full animate-ping" />
          </div>
          <span className="text-white text-2xl font-black bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">Carregando configurações...</span>
        </div>
      </div>
    )
  }

  if (configs.length === 0) {
    return (
      <div className="bg-gray-950/80 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/[0.15] p-16 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.06] via-white/[0.02] to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-tl from-purple-500/[0.10] via-transparent to-pink-500/[0.06]" />
        <div className="relative z-10">
          <div className="relative mb-8">
            <GitBranch className="w-20 h-20 text-slate-400 mx-auto" />
            <div className="absolute inset-0 w-20 h-20 bg-slate-400/10 rounded-full animate-pulse mx-auto" />
          </div>
          <h3 className="text-3xl font-black text-white mb-4 bg-gradient-to-r from-white via-purple-100 to-white bg-clip-text text-transparent">
            Nenhuma configuração encontrada
          </h3>
          <p className="text-slate-400 text-xl font-bold mb-10">
            Crie sua primeira configuração de sincronização para começar.
          </p>
          <button
            onClick={onCreateNew}
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700 text-white rounded-2xl hover:from-blue-700 hover:via-blue-800 hover:to-purple-800 focus:outline-none focus:ring-4 focus:ring-blue-500/30 transition-all duration-500 shadow-xl hover:shadow-2xl font-black text-lg group"
          >
            <Plus className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform duration-300" />
            Nova Configuração
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gray-950/80 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/[0.15] p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.06] via-white/[0.02] to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-tl from-blue-500/[0.10] via-transparent to-purple-500/[0.06]" />
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 rounded-2xl shadow-lg shadow-blue-500/30">
              <GitBranch className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-black text-white bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
              Configurações de Sincronização
            </h2>
          </div>
          <button
            onClick={onCreateNew}
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700 text-white rounded-2xl hover:from-blue-700 hover:via-blue-800 hover:to-purple-800 focus:outline-none focus:ring-4 focus:ring-blue-500/30 transition-all duration-500 shadow-xl hover:shadow-2xl font-black text-lg group"
          >
            <Plus className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform duration-300" />
            Nova Configuração
          </button>
        </div>
      </div>

      {/* Config List */}
      <div className="space-y-6">
        {configs.map((config) => {
          const isCurrentlySyncing = isSyncing(config.id)
          
          return (
            <div
              key={config.id}
              className={`bg-gray-950/80 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/[0.15] p-8 transition-all duration-500 hover:shadow-3xl hover:border-white/[0.25] relative overflow-hidden group ${
                isCurrentlySyncing ? 'ring-4 ring-blue-500/30 ring-opacity-100' : ''
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.06] via-white/[0.02] to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-tl from-purple-500/[0.08] via-transparent to-pink-500/[0.04] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="flex items-center justify-between relative z-10">
                {/* Config Info */}
                <div className="flex-1">
                  <div className="flex items-center space-x-6 mb-4">
                    <h3 className="text-2xl font-black text-white bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
                      {config.name}
                    </h3>
                    
                    {/* Status Badge */}
                    <span className={`inline-flex items-center px-4 py-2 rounded-2xl text-lg font-black shadow-xl border-2 ${
                      config.auto_sync
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-emerald-500/30'
                        : 'bg-gray-500/20 text-gray-300 border-gray-500/40 shadow-gray-500/30'
                    }`}>
                      {config.auto_sync ? 'Ativo' : 'Inativo'}
                    </span>
                    
                    {/* Syncing Indicator */}
                    {isCurrentlySyncing && (
                      <span className="inline-flex items-center px-4 py-2 rounded-2xl text-lg font-black bg-blue-500/20 text-blue-300 border-2 border-blue-500/40 shadow-xl shadow-blue-500/30 animate-pulse">
                        <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                        Sincronizando
                      </span>
                    )}
                  </div>
                  
                  {/* Repository Info */}
                  <div className="space-y-4 text-lg text-slate-300">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-blue-500/20 rounded-xl">
                        <GitBranch className="w-5 h-5 text-blue-400" />
                      </div>
                      <span className="font-black mr-3">Origem:</span>
                      <code className="bg-gray-800/60 px-4 py-2 rounded-2xl text-lg font-mono font-bold border border-white/[0.15] shadow-lg backdrop-blur-xl">
                        {config.source_path}
                      </code>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-purple-500/20 rounded-xl">
                        <GitBranch className="w-5 h-5 text-purple-400" />
                      </div>
                      <span className="font-black mr-3">Destino:</span>
                      <code className="bg-gray-800/60 px-4 py-2 rounded-2xl text-lg font-mono font-bold border border-white/[0.15] shadow-lg backdrop-blur-xl">
                        {config.target_repo}
                      </code>
                    </div>
                  </div>
                  
                  {/* Timestamps */}
                  <div className="mt-6 text-lg text-slate-400 font-bold">
                    <span>Criado em {formatDate(config.created_at)}</span>
                    {config.updated_at !== config.created_at && (
                      <span className="ml-6">
                        Atualizado em {formatDate(config.updated_at)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-4 ml-8">
                  {/* Toggle Enable/Disable */}
                  <button
                    onClick={() => onToggleEnabled(config)}
                    disabled={isCurrentlySyncing}
                    className={`p-4 rounded-2xl transition-all duration-300 shadow-xl hover:shadow-2xl ${
                      config.auto_sync
                        ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border-2 border-emerald-500/40'
                        : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30 border-2 border-gray-500/40'
                    } disabled:opacity-50 disabled:cursor-not-allowed group`}
                    title={config.auto_sync ? 'Desativar' : 'Ativar'}
                  >
                    {config.auto_sync ? (
                      <Pause className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
                    ) : (
                      <Play className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
                    )}
                  </button>

                  {/* Sync Button */}
                  <button
                    onClick={() => onSync(config)}
                    disabled={!config.auto_sync || isCurrentlySyncing}
                    className="p-4 bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 rounded-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl border-2 border-blue-500/40 group"
                    title="Sincronizar agora"
                  >
                    <RefreshCw className={`w-6 h-6 group-hover:scale-110 transition-transform duration-300 ${
                      isCurrentlySyncing ? 'animate-spin' : ''
                    }`} />
                  </button>

                  {/* Edit Button */}
                  <button
                    onClick={() => onEdit(config)}
                    disabled={isCurrentlySyncing}
                    className="p-4 bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 rounded-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl border-2 border-purple-500/40 group"
                    title="Editar"
                  >
                    <Edit className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDelete(config)}
                    disabled={isCurrentlySyncing}
                    className={`p-4 rounded-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl group ${
                      confirmDelete === config.id
                        ? 'bg-red-500/30 text-red-200 border-2 border-red-500/60'
                        : 'bg-red-500/20 text-red-300 hover:bg-red-500/30 border-2 border-red-500/40'
                    }`}
                    title={confirmDelete === config.id ? 'Clique novamente para confirmar' : 'Deletar'}
                  >
                    {confirmDelete === config.id ? (
                      <AlertCircle className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
                    ) : (
                      <Trash2 className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirmation Message */}
              {confirmDelete === config.id && (
                <div className="mt-6 p-6 bg-red-500/15 border-2 border-red-500/40 rounded-2xl shadow-xl backdrop-blur-xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-red-600/10" />
                  <div className="flex items-center relative z-10">
                    <div className="p-2 bg-red-500/30 rounded-xl mr-4">
                      <AlertCircle className="w-6 h-6 text-red-300" />
                    </div>
                    <span className="text-lg text-red-200 font-black">
                      Tem certeza? Clique novamente para confirmar a exclusão.
                    </span>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}