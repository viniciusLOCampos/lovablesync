import { useState, useEffect } from 'react'
import { RefreshCw, Filter, Download, Trash2, CheckCircle, XCircle, Clock, AlertCircle, Activity, FileText, Zap } from 'lucide-react'
import type { SyncLog, SyncConfig } from '../types'
import { supabaseService } from '../services/supabase'

interface LogsViewerProps {
  logs: SyncLog[]
  configs: SyncConfig[]
  onRefresh: () => void
  loading?: boolean
  showConfigFilter?: boolean
}

export default function LogsViewer({ logs, configs, onRefresh, loading = false, showConfigFilter = true }: LogsViewerProps) {
  const [filteredLogs, setFilteredLogs] = useState<SyncLog[]>(logs)
  const [selectedConfig, setSelectedConfig] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [cleaningLogs, setCleaningLogs] = useState(false)

  // Atualizar logs filtrados quando logs ou filtros mudam
  useEffect(() => {
    let filtered = [...logs]

    // Filtrar por configuração
    if (selectedConfig !== 'all') {
      filtered = filtered.filter(log => log.config_id === selectedConfig)
    }

    // Filtrar por status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(log => log.status === selectedStatus)
    }

    setFilteredLogs(filtered)
  }, [logs, selectedConfig, selectedStatus])

  const getStatusIcon = (status: SyncLog['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'in_progress':
        return <Clock className="w-4 h-4 text-blue-500" />
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusLabel = (status: SyncLog['status']) => {
    switch (status) {
      case 'success':
        return 'Success'
      case 'error':
        return 'Error'
      case 'in_progress':
        return 'In Progress'
      default:
        return 'Unknown'
    }
  }

  const getStatusColor = (status: SyncLog['status']) => {
    switch (status) {
      case 'success':
        return 'bg-green-500/20 text-green-300 border-green-500/30'
      case 'error':
        return 'bg-red-500/20 text-red-300 border-red-500/30'
      case 'in_progress':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/30'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const getConfigName = (configId: string) => {
    const config = configs.find(c => c.id === configId)
    return config?.name || 'Removed Configuration'
  }

  const exportLogs = () => {
    const csvContent = [
      ['Date', 'Configuration', 'Status', 'Files Processed', 'Message'].join(';'),
      ...filteredLogs.map(log => [
        formatDate(log.created_at),
        getConfigName(log.config_id),
        getStatusLabel(log.status),
        log.files_processed.toString(),
        log.message.replace(/;/g, ',')
      ].join(';'))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `sync-logs-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const cleanOldLogs = async () => {
    setCleaningLogs(true)
    try {
      const deletedCount = await supabaseService.cleanOldLogs()
      console.log(`${deletedCount} old logs were removed`)
      onRefresh() // Update logs list
    } catch (error: unknown) {
      console.error('Error cleaning old logs:', error)
    } finally {
      setCleaningLogs(false)
    }
  }

  const getLogAge = (dateString: string) => {
    const logDate = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - logDate.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) {
      return 'Just now'
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      return `${diffInDays}d ago`
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between p-10 bg-gray-950/80 backdrop-blur-2xl rounded-3xl border border-white/[0.15] shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] via-white/[0.02] to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-tl from-emerald-500/[0.12] via-transparent to-teal-500/[0.08]" />
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-96 h-24 bg-gradient-to-r from-emerald-400/15 via-teal-400/15 to-cyan-400/15 blur-2xl" />
        
        <div className="flex items-center space-x-6 relative z-10">
          <div className="p-4 bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 rounded-3xl shadow-2xl shadow-emerald-500/40 relative group">
            <Activity className="w-8 h-8 text-white animate-pulse group-hover:scale-110 transition-transform duration-500" />
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-white/10 to-transparent rounded-3xl" />
            <div className="absolute -inset-1 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-3xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity duration-500" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-white flex items-center tracking-tight">
              <span className="bg-gradient-to-r from-white via-emerald-100 to-white bg-clip-text text-transparent">
                Sync Logs
              </span>
              <span className="ml-6 text-lg bg-emerald-500/25 text-emerald-200 px-6 py-3 rounded-2xl font-bold border border-emerald-500/40 shadow-lg backdrop-blur-xl">
                {logs.length} entries
              </span>
            </h2>
            <p className="text-slate-300 text-lg font-medium mt-2">Monitor your synchronization activities</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-6 relative z-10">
          <button
            onClick={cleanOldLogs}
            disabled={cleaningLogs}
            className="group inline-flex items-center px-8 py-4 text-lg font-bold bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 text-white rounded-2xl hover:from-amber-400 hover:via-amber-500 hover:to-orange-500 focus:outline-none focus:ring-4 focus:ring-amber-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-500 shadow-2xl hover:shadow-amber-500/40 transform hover:scale-105 relative overflow-hidden"
            title="Clean logs older than 3 days"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/10 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="p-2 bg-white/15 rounded-xl mr-3 group-hover:bg-white/25 transition-all duration-300">
              {cleaningLogs ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <Trash2 className="w-5 h-5 group-hover:rotate-12 transition-transform duration-500" />
              )}
            </div>
            <span className="relative z-10">Clean Old</span>
          </button>
          
          <button
            onClick={exportLogs}
            disabled={filteredLogs.length === 0}
            className="group inline-flex items-center px-8 py-4 text-lg font-bold bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 text-white rounded-2xl hover:from-emerald-400 hover:via-emerald-500 hover:to-teal-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-500 shadow-2xl hover:shadow-emerald-500/40 transform hover:scale-105 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/10 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="p-2 bg-white/15 rounded-xl mr-3 group-hover:bg-white/25 transition-all duration-300">
              <Download className="w-5 h-5 group-hover:translate-y-1 transition-transform duration-500" />
            </div>
            <span className="relative z-10">Export CSV</span>
          </button>
          
          <button
            onClick={onRefresh}
            disabled={loading}
            className="group inline-flex items-center px-8 py-4 text-lg font-bold bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 text-white rounded-2xl hover:from-blue-400 hover:via-blue-500 hover:to-indigo-500 focus:outline-none focus:ring-4 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-500 shadow-2xl hover:shadow-blue-500/40 transform hover:scale-105 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/10 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="p-2 bg-white/15 rounded-xl mr-3 group-hover:bg-white/25 transition-all duration-300">
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : 'group-hover:rotate-180'} transition-transform duration-500`} />
            </div>
            <span className="relative z-10">Refresh</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-950/80 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/[0.15] p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.06] via-white/[0.02] to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-tl from-purple-500/[0.10] via-transparent to-pink-500/[0.06]" />
        
        <div className="flex items-center space-x-10 relative z-10">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-purple-500 via-purple-600 to-pink-600 rounded-2xl shadow-lg shadow-purple-500/30">
              <Filter className="w-6 h-6 text-white" />
            </div>
            <span className="font-black text-white text-xl bg-gradient-to-r from-white via-purple-100 to-white bg-clip-text text-transparent">Filters:</span>
          </div>
          
          {/* Config Filter */}
          {showConfigFilter && (
            <div className="flex items-center space-x-6">
              <label htmlFor="config-filter" className="text-lg font-black text-slate-200 flex items-center">
                <div className="p-2 bg-blue-500 rounded-xl mr-3 shadow-lg shadow-blue-500/30">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                Configuration:
              </label>
              <select
                id="config-filter"
                value={selectedConfig}
                onChange={(e) => setSelectedConfig(e.target.value)}
                className="text-lg border-2 border-white/[0.15] rounded-2xl px-6 py-4 focus:outline-none focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 transition-all duration-500 bg-gray-800/60 text-white shadow-xl hover:shadow-2xl backdrop-blur-xl font-bold"
              >
                <option value="all">All Configurations</option>
                {configs.map(config => (
                  <option key={config.id} value={config.id}>
                    {config.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          {/* Status Filter */}
          <div className="flex items-center space-x-6">
            <label htmlFor="status-filter" className="text-lg font-black text-slate-200 flex items-center">
              <div className="p-2 bg-emerald-500 rounded-xl mr-3 shadow-lg shadow-emerald-500/30">
                <Zap className="w-5 h-5 text-white" />
              </div>
              Status:
            </label>
            <select
              id="status-filter"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="text-lg border-2 border-white/[0.15] rounded-2xl px-6 py-4 focus:outline-none focus:ring-4 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all duration-500 bg-gray-800/60 text-white shadow-xl hover:shadow-2xl backdrop-blur-xl font-bold"
            >
              <option value="all">All Status</option>
              <option value="success">Success</option>
              <option value="error">Error</option>
              <option value="in_progress">In Progress</option>
            </select>
          </div>
          
          {/* Results Count */}
          <div className="flex items-center space-x-3 ml-auto">
            <div className="text-lg font-black text-slate-200 bg-gray-800/60 px-6 py-4 rounded-2xl border border-white/[0.15] shadow-xl backdrop-blur-xl">
              <span className="bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
                {filteredLogs.length} of {logs.length} logs
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Logs List */}
      <div className="space-y-6">
        {loading ? (
          <div className="bg-gray-950/80 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/[0.15] p-20 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.06] via-white/[0.02] to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-tl from-blue-500/[0.10] via-transparent to-indigo-500/[0.06]" />
            <div className="relative z-10">
              <div className="relative mb-8">
                <RefreshCw className="w-16 h-16 text-blue-400 animate-spin mx-auto" />
                <div className="absolute inset-0 w-16 h-16 bg-blue-500/20 rounded-full animate-ping mx-auto" />
              </div>
              <span className="text-slate-300 font-black animate-pulse text-2xl bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">Loading logs...</span>
            </div>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="bg-gray-950/80 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/[0.15] p-20 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.06] via-white/[0.02] to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-tl from-purple-500/[0.10] via-transparent to-pink-500/[0.06]" />
            <div className="relative z-10">
              <div className="relative mb-8">
                <AlertCircle className="w-20 h-20 text-slate-400 mx-auto" />
                <div className="absolute inset-0 w-20 h-20 bg-slate-400/10 rounded-full animate-pulse mx-auto" />
              </div>
              <p className="text-slate-300 font-black text-3xl mb-4 bg-gradient-to-r from-white via-purple-100 to-white bg-clip-text text-transparent">
                {logs.length === 0 ? 'No logs found' : 'No logs match the selected filters'}
              </p>
              <p className="text-slate-400 text-xl font-bold">
                {logs.length === 0 ? 'Run a synchronization to generate logs' : 'Try adjusting the filters'}
              </p>
            </div>
          </div>
        ) : (
          filteredLogs.map((log, index) => (
            <div 
              key={log.id} 
              className="bg-gray-950/80 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/[0.15] p-10 hover:shadow-3xl transition-all duration-500 hover:border-white/[0.25] relative overflow-hidden group"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.06] via-white/[0.02] to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-tl from-purple-500/[0.08] via-transparent to-pink-500/[0.04] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="flex items-start justify-between relative z-10">
                <div className="flex-1">
                  {/* Header */}
                  <div className="flex items-center space-x-8 mb-6">
                    <div className="relative">
                      <div className={`p-4 rounded-2xl shadow-xl ${
                        log.status === 'success' ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-emerald-500/30' :
                        log.status === 'error' ? 'bg-gradient-to-br from-red-500 to-red-600 shadow-red-500/30' :
                        'bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-500/30'
                      }`}>
                        {getStatusIcon(log.status)}
                      </div>
                      {log.status === 'in_progress' && (
                        <div className="absolute inset-0 animate-ping w-full h-full bg-blue-500/30 rounded-2xl" />
                      )}
                    </div>
                    
                    <span className={`inline-flex items-center px-6 py-3 rounded-2xl text-lg font-black shadow-xl border-2 ${
                      getStatusColor(log.status)
                    } ${log.status === 'in_progress' ? 'animate-pulse' : ''}`}>
                      {getStatusLabel(log.status)}
                    </span>
                    
                    <span className="text-lg font-black text-white bg-gray-800/60 px-6 py-3 rounded-2xl border border-white/[0.15] shadow-xl backdrop-blur-xl">
                      {getConfigName(log.config_id)}
                    </span>
                    
                    {log.files_processed > 0 && (
                      <span className="text-lg bg-blue-500/20 text-blue-300 px-6 py-3 rounded-2xl font-black flex items-center border-2 border-blue-500/40 shadow-xl backdrop-blur-xl">
                        <FileText className="w-5 h-5 mr-3" />
                        {log.files_processed} files
                      </span>
                    )}
                  </div>
                  
                  {/* Message */}
                  <div className={`p-6 rounded-2xl mb-6 border-l-4 font-mono text-lg shadow-xl backdrop-blur-xl ${
                    log.status === 'error' 
                      ? 'bg-red-500/15 border-red-500 text-red-300' 
                      : log.status === 'success'
                      ? 'bg-green-500/15 border-green-500 text-green-300'
                      : log.status === 'in_progress'
                      ? 'bg-blue-500/15 border-blue-500 text-blue-300'
                      : 'bg-slate-500/15 border-slate-500 text-slate-300'
                  }`}>
                    <p className="font-bold leading-relaxed">
                      {log.message}
                    </p>
                  </div>
                  
                  {/* Timestamp */}
                  <div className="flex items-center space-x-10 text-lg">
                    <div className="flex items-center space-x-4 text-slate-400">
                      <div className="p-2 bg-slate-700/50 rounded-xl">
                        <Clock className="w-5 h-5" />
                      </div>
                      <span className="font-black font-mono">{formatDate(log.created_at)}</span>
                    </div>
                    <div className="flex items-center space-x-4 text-slate-500">
                      <div className="p-2 bg-slate-700/50 rounded-xl">
                        <Activity className="w-5 h-5" />
                      </div>
                      <span className="font-mono font-bold">{getLogAge(log.created_at)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Info about log retention */}
      <div className="text-center p-6 bg-slate-800/30 backdrop-blur-sm rounded-2xl border border-white/[0.08]">
        <div className="flex items-center justify-center space-x-3 text-sm text-slate-400">
          <AlertCircle className="w-5 h-5 text-blue-400" />
          <span className="font-medium">
            Logs are kept for 3 days and automatically removed after this period.
          </span>
        </div>
      </div>
    </div>
  )
}