import { Activity, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import type { SyncLog, SyncProgress } from '../types'

interface ProjectStatsCardProps {
  logs: SyncLog[]
  progress?: SyncProgress
  isSyncing: boolean
}

export default function ProjectStatsCard({ logs, progress, isSyncing }: ProjectStatsCardProps) {
  const successCount = logs.filter(log => log.status === 'success').length
  const errorCount = logs.filter(log => log.status === 'error').length
  const lastSync = logs.find(log => log.status === 'success')
  const totalSyncs = logs.length

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Status Atual */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 hover:border-white/[0.12] transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-blue-500/20 rounded-xl">
            <Activity className="w-6 h-6 text-blue-400" />
          </div>
          {isSyncing && (
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
              <span className="text-xs text-blue-400 font-medium">Sincronizando</span>
            </div>
          )}
        </div>
        <h3 className="text-lg font-semibold text-white mb-1">Status</h3>
        <p className={`text-sm font-medium ${
          isSyncing 
            ? 'text-blue-400' 
            : errorCount > successCount 
              ? 'text-red-400' 
              : 'text-emerald-400'
        }`}>
          {isSyncing 
            ? 'Sincronizando...' 
            : errorCount > successCount 
              ? 'Com Problemas' 
              : 'Funcionando'
          }
        </p>
        {progress && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Progresso</span>
              <span>{Math.round(progress.progress)}%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress.progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Total de Sincronizações */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 hover:border-white/[0.12] transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-purple-500/20 rounded-xl">
            <Activity className="w-6 h-6 text-purple-400" />
          </div>
        </div>
        <h3 className="text-lg font-semibold text-white mb-1">Total</h3>
        <p className="text-2xl font-bold text-purple-400">{totalSyncs}</p>
        <p className="text-xs text-slate-400 mt-1">Sincronizações</p>
      </div>

      {/* Sucessos */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 hover:border-white/[0.12] transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-emerald-500/20 rounded-xl">
            <CheckCircle className="w-6 h-6 text-emerald-400" />
          </div>
        </div>
        <h3 className="text-lg font-semibold text-white mb-1">Sucessos</h3>
        <p className="text-2xl font-bold text-emerald-400">{successCount}</p>
        <p className="text-xs text-slate-400 mt-1">
          {totalSyncs > 0 ? `${Math.round((successCount / totalSyncs) * 100)}%` : '0%'} de sucesso
        </p>
      </div>

      {/* Última Sincronização */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 hover:border-white/[0.12] transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-slate-500/20 rounded-xl">
            <Clock className="w-6 h-6 text-slate-400" />
          </div>
          {errorCount > 0 && (
            <AlertCircle className="w-5 h-5 text-red-400" />
          )}
        </div>
        <h3 className="text-lg font-semibold text-white mb-1">Última Sync</h3>
        {lastSync ? (
          <>
            <p className="text-sm font-medium text-slate-300">
              {formatDate(lastSync.created_at)}
            </p>
            <p className="text-xs text-emerald-400 mt-1">Sucesso</p>
          </>
        ) : (
          <p className="text-sm text-slate-400">Nunca sincronizado</p>
        )}
      </div>
    </div>
  )
}
