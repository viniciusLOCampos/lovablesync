import { CheckCircle, XCircle, Clock, AlertCircle, Loader2 } from 'lucide-react'
import type { SyncProgress as SyncProgressType } from '../types'

interface SyncProgressProps {
  progress: SyncProgressType[]
  className?: string
}

export default function SyncProgress({ progress, className = '' }: SyncProgressProps) {
  const getStatusIcon = (status: SyncProgressType['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-7 h-7 text-emerald-400" />
      case 'error':
        return <XCircle className="w-7 h-7 text-red-400" />
      case 'in_progress':
        return <Loader2 className="w-7 h-7 text-blue-400 animate-spin" />
      default:
        return <Clock className="w-7 h-7 text-slate-400" />
    }
  }

  const getStatusColor = (status: SyncProgressType['status']) => {
    switch (status) {
      case 'success':
        return 'bg-gradient-to-r from-emerald-500 to-emerald-600'
      case 'error':
        return 'bg-gradient-to-r from-red-500 to-red-600'
      case 'in_progress':
        return 'bg-gradient-to-r from-blue-500 to-blue-600'
      default:
        return 'bg-gradient-to-r from-gray-400 to-gray-500'
    }
  }

  const getProgressPercentage = (item: SyncProgressType) => {
    if (item.status === 'success') return 100
    if (item.status === 'error') return 0
    if (item.totalFiles === 0) return 0
    return Math.round((item.filesProcessed / item.totalFiles) * 100)
  }

  const getStepLabel = (step: SyncProgressType['currentStep']) => {
    switch (step) {
      case 'deleting':
        return 'Deletando arquivos'
      case 'copying':
        return 'Copiando arquivos'
      case 'completed':
        return 'Concluído'
      case 'error':
        return 'Erro'
      default:
        return 'Aguardando'
    }
  }

  if (progress.length === 0) {
    return (
      <div className={`bg-gray-950/80 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/[0.15] p-12 text-center relative overflow-hidden ${className}`}>
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.06] via-white/[0.02] to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-tl from-blue-500/[0.10] via-transparent to-indigo-500/[0.06]" />
        <div className="relative z-10">
          <div className="relative mb-6">
            <Clock className="w-16 h-16 text-slate-400 mx-auto" />
            <div className="absolute inset-0 w-16 h-16 bg-slate-400/10 rounded-full animate-pulse mx-auto" />
          </div>
          <p className="text-slate-300 text-xl font-black bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">Nenhuma sincronização em andamento</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-8 ${className}`}>
      <div className="bg-gray-950/80 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/[0.15] p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.06] via-white/[0.02] to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-tl from-purple-500/[0.10] via-transparent to-pink-500/[0.06]" />
        <div className="flex items-center space-x-4 relative z-10">
          <div className="p-3 bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 rounded-2xl shadow-lg shadow-blue-500/30">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
          <h3 className="text-3xl font-black text-white bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
            Progresso das Sincronizações
          </h3>
        </div>
      </div>
      
      {progress.map((item) => {
        const percentage = getProgressPercentage(item)
        
        return (
          <div
            key={item.configId}
            className="bg-gray-950/80 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/[0.15] p-8 relative overflow-hidden group hover:shadow-3xl hover:shadow-blue-500/20 transition-all duration-500 hover:scale-[1.02]"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.06] via-white/[0.02] to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-tl from-blue-500/[0.08] via-transparent to-purple-500/[0.05] group-hover:from-blue-500/[0.12] group-hover:to-purple-500/[0.08] transition-all duration-500" />
            
            <div className="relative z-10">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-2xl shadow-lg border border-white/[0.1]">
                    {getStatusIcon(item.status)}
                  </div>
                  <div>
                    <h4 className="text-2xl font-black text-white bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
                      {item.configName}
                    </h4>
                    <p className="text-lg text-slate-300 font-semibold">
                      {getStepLabel(item.currentStep)}
                    </p>
                  </div>
                </div>
                
                {item.status === 'in_progress' && (
                  <div className="text-right">
                    <div className="text-3xl font-black text-white bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                      {percentage}%
                    </div>
                    <div className="text-sm text-slate-400 font-medium">
                      {item.filesProcessed} / {item.totalFiles}
                    </div>
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="w-full bg-gray-800/60 rounded-full h-3 backdrop-blur-xl border border-white/[0.08]">
                  <div
                    className={`h-3 rounded-full transition-all duration-500 shadow-lg ${
                      getStatusColor(item.status)
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>

              {/* Message */}
              <div className="flex items-start space-x-3 mb-4">
                {item.status === 'error' && (
                  <div className="p-2 bg-red-500/20 rounded-xl border border-red-500/30">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  </div>
                )}
                <div className="bg-gray-900/60 backdrop-blur-xl rounded-2xl p-4 flex-1 border border-white/[0.08]">
                  <p className={`text-lg font-medium ${
                    item.status === 'error' ? 'text-red-300' : 'text-slate-200'
                  }`}>
                    {item.message}
                  </p>
                </div>
              </div>

              {/* Additional Info for In Progress */}
              {item.status === 'in_progress' && item.currentStep !== 'error' && (
                <div className="bg-gray-900/40 backdrop-blur-xl rounded-2xl p-4 border border-white/[0.06]">
                  <div className="flex justify-between text-sm text-slate-300">
                    <span className="font-semibold">Etapa atual: {getStepLabel(item.currentStep)}</span>
                    {item.totalFiles > 0 && (
                      <span className="text-slate-400">
                        {item.filesProcessed} de {item.totalFiles} arquivos
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Success Summary */}
              {item.status === 'success' && (
                <div className="bg-gradient-to-r from-emerald-500/20 via-emerald-600/20 to-green-500/20 backdrop-blur-xl rounded-2xl p-4 border border-emerald-400/30">
                  <div className="flex items-center justify-between text-lg">
                    <span className="text-emerald-300 font-black flex items-center space-x-2">
                      <CheckCircle className="w-6 h-6" />
                      <span>✓ Sincronização concluída</span>
                    </span>
                    <span className="text-slate-300 font-semibold">
                      {item.filesProcessed} arquivos processados
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Componente para uma barra de progresso simples
export function ProgressBar({ 
  progress, 
  status, 
  message, 
  className = '' 
}: {
  progress: number
  status: 'success' | 'error' | 'in_progress'
  message?: string
  className?: string
}) {
  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'bg-gradient-to-r from-emerald-500 to-emerald-600'
      case 'error':
        return 'bg-gradient-to-r from-red-500 to-red-600'
      case 'in_progress':
        return 'bg-gradient-to-r from-blue-500 to-blue-600'
      default:
        return 'bg-gradient-to-r from-gray-400 to-gray-500'
    }
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {message && (
        <p className="text-sm text-slate-300 font-medium">{message}</p>
      )}
      
      <div className="flex items-center space-x-4">
        <div className="flex-1 bg-gray-800/60 rounded-full h-4 backdrop-blur-xl border border-white/[0.08] shadow-inner">
          <div
            className={`h-4 rounded-full transition-all duration-700 shadow-lg shadow-blue-500/30 relative overflow-hidden ${
              getStatusColor()
            }`}
            style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/10 to-transparent animate-pulse" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-white/20" />
          </div>
        </div>
        
        <span className="text-lg font-black text-white bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent min-w-[4rem] text-right">
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  )
}