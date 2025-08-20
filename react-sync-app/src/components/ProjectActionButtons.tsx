import React from 'react'
import { Play, Pause, Edit, Trash2, Power, PowerOff } from 'lucide-react'
import type { SyncConfig } from '../types'

interface ProjectActionButtonsProps {
  config: SyncConfig
  isSyncing: boolean
  onEdit: (config: SyncConfig) => void
  onDelete: (config: SyncConfig) => void
  onSync: (config: SyncConfig) => void
  onToggleEnabled: (config: SyncConfig) => void
}

export default function ProjectActionButtons({
  config,
  isSyncing,
  onEdit,
  onDelete,
  onSync,
  onToggleEnabled
}: ProjectActionButtonsProps) {
  return (
    <div className="flex items-center space-x-3">
      {/* Botão de Sincronizar/Pausar */}
      <button
        onClick={() => onSync(config)}
        disabled={!config.auto_sync}
        className={`group relative overflow-hidden px-6 py-3 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${
          isSyncing
            ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white shadow-lg shadow-red-500/25'
            : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white shadow-lg shadow-blue-500/25'
        }`}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="relative flex items-center space-x-2">
          {isSyncing ? (
            <>
              <Pause className="w-5 h-5" />
              <span>Pausar</span>
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              <span>Sincronizar</span>
            </>
          )}
        </div>
      </button>

      {/* Botão de Ativar/Desativar */}
      <button
        onClick={() => onToggleEnabled(config)}
        className={`group relative overflow-hidden p-3 rounded-2xl transition-all duration-300 transform hover:scale-105 ${
          config.auto_sync
            ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white shadow-lg shadow-emerald-500/25'
            : 'bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 text-white shadow-lg shadow-slate-500/25'
        }`}
        title={config.auto_sync ? 'Desativar projeto' : 'Ativar projeto'}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="relative">
          {config.auto_sync ? (
            <Power className="w-5 h-5" />
          ) : (
            <PowerOff className="w-5 h-5" />
          )}
        </div>
      </button>

      {/* Botão de Editar */}
      <button
        onClick={() => onEdit(config)}
        className="group relative overflow-hidden p-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-500 text-white rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg shadow-purple-500/25"
        title="Editar projeto"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="relative">
          <Edit className="w-5 h-5" />
        </div>
      </button>

      {/* Botão de Deletar */}
      <button
        onClick={() => onDelete(config)}
        className="group relative overflow-hidden p-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg shadow-red-500/25"
        title="Deletar projeto"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="relative">
          <Trash2 className="w-5 h-5" />
        </div>
      </button>
    </div>
  )
}