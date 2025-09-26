import { useState, useEffect } from 'react'
import { ArrowRight, Github, Activity, CheckCircle, AlertCircle, Clock, PowerOff, Zap, BarChart3, TrendingUp } from 'lucide-react'
import type { SyncConfig, SyncLog, SyncProgress, GitHubRepo } from '../types'
import { githubAuth } from '../services/auth'
import { supabaseService } from '../services/supabase'
import LogsViewer from './LogsViewer'
import RepositoryDropdown from './RepositoryDropdown'
import ProjectActionButtons from './ProjectActionButtons'
interface ProjectTabProps {
  config: SyncConfig
  logs: SyncLog[]
  progress: SyncProgress | null
  onEdit: (config: SyncConfig) => void
  onDelete: (config: SyncConfig) => void
  onSync: (config: SyncConfig) => void
  onToggleEnabled: (config: SyncConfig) => void
  isSyncing: boolean
  onRefreshLogs: () => void
  loading: boolean
  onUpdateConfig: (config: SyncConfig) => void
}
const ProjectTab = ({
  config,
  logs,
  progress,
  onEdit,
  onDelete,
  onSync,
  onToggleEnabled,
  isSyncing,
  onRefreshLogs,
  loading,
  onUpdateConfig
}: ProjectTabProps) => {
  const [activeSection, setActiveSection] = useState<'overview' | 'logs'>('overview')
  const [isVisible, setIsVisible] = useState(false)
  const [pulseSync, setPulseSync] = useState(false)
  const [showSourceRepos, setShowSourceRepos] = useState(false)
  const [showTargetRepos, setShowTargetRepos] = useState(false)
  const [userRepositories, setUserRepositories] = useState<GitHubRepo[]>([])
  const [loadingRepos, setLoadingRepos] = useState(false)
  // Animação de entrada
  useEffect(() => {
    setIsVisible(true)
  }, [])
  // Efeito de pulse no botão de sync quando há mudanças
  useEffect(() => {
    if (!isSyncing) {
      setPulseSync(true)
      const timer = setTimeout(() => setPulseSync(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [config.updated_at, isSyncing])
  const projectLogs = logs.filter(log => log.config_id === config.id)
  const lastSync = projectLogs.find(log => log.status === 'success')
  // Carregar repositórios do usuário do GitHub
  const loadUserRepositories = async () => {
    if (userRepositories.length > 0) return // Já carregados
    
    setLoadingRepos(true)
    try {
      const repos = await githubAuth.getUserRepositories()
      setUserRepositories(repos)
    } catch (error) {
      console.error('Erro ao carregar repositórios:', error)
    } finally {
      setLoadingRepos(false)
    }
  }
  // Atualizar repositório
  const handleRepoUpdate = async (repoName: string, type: 'source' | 'target') => {
    try {
      // Validar entrada
      if (!repoName || typeof repoName !== 'string') {
        console.error('Nome do repositório inválido:', repoName)
        return
      }
      
      if (!config?.id) {
        console.error('ID da configuração não encontrado')
        return
      }
      
      const updateData = {
        [type === 'source' ? 'source_path' : 'target_repo']: repoName
      }
      
      const updatedConfig = await supabaseService.updateConfig(config.id, updateData)
      
      onUpdateConfig(updatedConfig)
      
      // Fechar dropdown
      if (type === 'source') setShowSourceRepos(false)
      if (type === 'target') setShowTargetRepos(false)
      
    } catch (error) {
      console.error('Erro ao atualizar repositório:', error)
      
      // Mostrar mensagem de erro mais específica
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      console.error(`Falha ao atualizar repositório ${type}: ${errorMessage}`)
    }
  }
  // Carregar repositórios do usuário na inicialização
  useEffect(() => {
    loadUserRepositories()
  }, [])
  // Abrir dropdown e carregar repos se necessário
  const handleDropdownToggle = (type: 'source' | 'target') => {
    if (type === 'source') {
      setShowSourceRepos(!showSourceRepos)
      setShowTargetRepos(false)
    } else {
      setShowTargetRepos(!showTargetRepos)
      setShowSourceRepos(false)
    }
    
    if (userRepositories.length === 0) {
      loadUserRepositories()
    }
  }
  const lastError = projectLogs.find(log => log.status === 'error')
  const getStatusColor = () => {
    if (!config.auto_sync) return 'text-gray-500'
    if (isSyncing) return 'text-blue-500'
    if (lastError && (!lastSync || new Date(lastError.created_at) > new Date(lastSync.created_at))) {
      return 'text-red-500'
    }
    if (lastSync) return 'text-green-500'
    return 'text-gray-500'
  }
  const getStatusIcon = () => {
    if (!config.auto_sync) return <PowerOff className="w-5 h-5" />
    if (isSyncing) return <Activity className="w-5 h-5 animate-spin" />
    if (lastError && (!lastSync || new Date(lastError.created_at) > new Date(lastSync.created_at))) {
      return <AlertCircle className="w-5 h-5" />
    }
    if (lastSync) return <CheckCircle className="w-5 h-5" />
    return <Clock className="w-5 h-5" />
  }
  const getStatusText = () => {
    if (!config.auto_sync) return 'Desabilitado'
    if (isSyncing) return 'Sincronizando...'
    if (lastError && (!lastSync || new Date(lastError.created_at) > new Date(lastSync.created_at))) {
      return 'Erro na última sincronização'
    }
    if (lastSync) {
      const date = new Date(lastSync.created_at)
      return `Última sincronização: ${date.toLocaleDateString()} às ${date.toLocaleTimeString()}`
    }
    return 'Nunca sincronizado'
  }
  return (
    <div className={`space-y-6 transition-all duration-500 ease-out transform ${
      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
    }`}>
      {/* Project Header */}
      <div className="relative z-10 bg-white/[0.02] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 shadow-2xl shadow-black/10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className={`p-4 rounded-2xl transition-all duration-300 ${
              config.auto_sync 
                ? 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25' 
                : 'bg-gradient-to-br from-slate-500 to-slate-600 shadow-lg shadow-slate-500/25'
            }`}>
              <Github className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">{config.name}</h2>
              <div className={`flex items-center space-x-2 ${getStatusColor()}`}>
                {getStatusIcon()}
                <span className="text-sm font-medium">{getStatusText()}</span>
              </div>
            </div>
          </div>
          
          <ProjectActionButtons
             config={config}
            isSyncing={isSyncing}
            onToggleEnabled={onToggleEnabled}
            onEdit={onEdit}
            onDelete={onDelete}
            onSync={onSync}
           />
        </div>
        
        {/* Repository Flow */}
        <div className="relative z-20 flex items-center justify-center space-x-8 p-6 bg-white/[0.02] rounded-2xl border border-white/[0.05] overflow-visible">
          <RepositoryDropdown
            label=""
            value={config.source_path}
            repositories={userRepositories}
            loading={loadingRepos}
            isOpen={showSourceRepos}
            onToggle={() => handleDropdownToggle('source')}
            onSelect={(repoFullName) => handleRepoUpdate(repoFullName, 'source')}
            colorScheme="blue"
            placeholder="Selecione um repositório"
            variant="card"
            showLabel={false}
          />
          
          <div className="flex flex-col items-center space-y-2">
            <ArrowRight className="w-8 h-8 text-blue-400 animate-pulse" />
            <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full animate-ping" />
          </div>
          
          <RepositoryDropdown
            label=""
            value={config.target_repo}
            repositories={userRepositories}
            loading={loadingRepos}
            isOpen={showTargetRepos}
            onToggle={() => handleDropdownToggle('target')}
            onSelect={(repoFullName) => handleRepoUpdate(repoFullName, 'target')}
            colorScheme="emerald"
            placeholder="Selecione um repositório"
            variant="card"
            showLabel={false}
          />
        </div>
        
        {/* Sync Button */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={() => onSync(config)}
            disabled={!config.auto_sync || isSyncing}
            className={`
              group relative flex items-center space-x-4 px-10 py-4 rounded-2xl font-bold text-lg transition-all duration-300 transform
              ${config.auto_sync && !isSyncing
                ? `bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white 
                   hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 
                   shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/50 
                   hover:scale-105 active:scale-95
                   ${pulseSync ? 'animate-pulse' : ''}`
                : 'bg-gradient-to-r from-slate-600 to-slate-700 text-slate-400 cursor-not-allowed shadow-lg'
              }
            `}
          >
            {/* Glow effect */}
            {config.auto_sync && !isSyncing && (
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/10 via-transparent to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            )}
            
            {isSyncing ? (
              <>
                <div className="relative">
                  <div className="animate-spin w-6 h-6 border-3 border-white border-t-transparent rounded-full" />
                  <div className="absolute inset-0 animate-ping w-6 h-6 border border-white/50 rounded-full" />
                </div>
                <span className="relative z-10">Synchronizing...</span>
              </>
            ) : (
              <>
                <div className="relative">
                  <Zap className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
                  {pulseSync && (
                    <div className="absolute inset-0 animate-ping w-6 h-6 bg-white/30 rounded-full" />
                  )}
                </div>
                <span className="relative z-10">Sync Now</span>
                {config.auto_sync && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50" />
                )}
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Real-time Progress */}
      {progress && (
        <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 shadow-2xl shadow-black/10 animate-in slide-in-from-top duration-500">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center">
            <div className="relative mr-3">
              <Activity className="w-6 h-6 text-blue-400 animate-spin" />
              <div className="absolute inset-0 w-6 h-6 bg-blue-400/20 rounded-full animate-ping" />
            </div>
            Synchronization Progress
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-300">
                {progress.currentStep === 'deleting' && 'Deleting target files...'}
                {progress.currentStep === 'copying' && 'Copying source files...'}
                {progress.currentStep === 'completed' && 'Synchronization completed!'}
                {progress.currentStep === 'error' && 'Synchronization error'}
              </span>
              <span className="text-sm text-slate-400">
                {progress.totalFiles > 0 && `${progress.filesProcessed}/${progress.totalFiles} files`}
              </span>
            </div>
            
            {progress.totalFiles > 0 && (
              <div className="relative w-full bg-slate-800/50 rounded-full h-4 overflow-hidden shadow-inner border border-slate-700/50">
                <div
                  className={`h-4 rounded-full transition-all duration-500 ease-out relative ${
                    progress.status === 'success' ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
                    progress.status === 'error' ? 'bg-gradient-to-r from-red-400 to-pink-500' : 
                    'bg-gradient-to-r from-blue-400 to-indigo-500'
                  }`}
                  style={{ width: `${(progress.filesProcessed / progress.totalFiles) * 100}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-white/20 animate-pulse" />
                </div>
                {progress.status === 'in_progress' && (
                  <div className="absolute top-0 left-0 h-4 w-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
                )}
              </div>
            )}
            
            <p className="text-sm text-slate-300">{progress.message}</p>
          </div>
        </div>
      )}
      
      {/* Section Navigation */}
      <div className="relative z-0 bg-white/[0.02] backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/10 overflow-hidden">
        <div className="border-b border-white/[0.08] bg-gradient-to-r from-slate-800/30 to-slate-900/30">
          <nav className="flex space-x-2 px-6">
            <button
              onClick={() => setActiveSection('overview')}
              className={`group relative py-4 px-6 font-semibold text-sm transition-all duration-300 rounded-t-xl ${
                activeSection === 'overview'
                  ? 'text-blue-400 bg-slate-800/50 shadow-lg transform -translate-y-1 border-x border-t border-white/[0.08]'
                  : 'text-slate-300 hover:text-blue-400 hover:bg-white/[0.05]'
              }`}
            >
              <div className="flex items-center space-x-2">
                <BarChart3 className={`w-4 h-4 transition-transform duration-300 ${
                  activeSection === 'overview' ? 'scale-110' : 'group-hover:scale-110'
                }`} />
                <span>Overview</span>
              </div>
              {activeSection === 'overview' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" />
              )}
            </button>
            
            <button
              onClick={() => setActiveSection('logs')}
              className={`group relative py-4 px-6 font-semibold text-sm transition-all duration-300 rounded-t-xl ${
                activeSection === 'logs'
                  ? 'text-blue-400 bg-slate-800/50 shadow-lg transform -translate-y-1 border-x border-t border-white/[0.08]'
                  : 'text-slate-300 hover:text-blue-400 hover:bg-white/[0.05]'
              }`}
            >
              <div className="flex items-center space-x-2">
                <TrendingUp className={`w-4 h-4 transition-transform duration-300 ${
                  activeSection === 'logs' ? 'scale-110' : 'group-hover:scale-110'
                }`} />
                <span>Logs</span>
                {projectLogs.length > 0 && (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold transition-all duration-300 ${
                    activeSection === 'logs'
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg'
                      : 'bg-blue-500/20 text-blue-300 group-hover:bg-blue-500/30'
                  }`}>
                    {projectLogs.length}
                  </span>
                )}
              </div>
              {activeSection === 'logs' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" />
              )}
            </button>
          </nav>
        </div>
        
        <div className="p-6">
          {activeSection === 'overview' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 p-6 rounded-xl shadow-lg border border-blue-500/20 hover:shadow-xl transition-all duration-300">
                  <h4 className="font-bold text-white mb-4 flex items-center">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse" />
                    Project Information
                  </h4>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-slate-400">Status:</dt>
                      <dd className={`font-medium ${getStatusColor()}`}>
                        {config.auto_sync ? 'Active' : 'Inactive'}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-slate-400">Created:</dt>
                      <dd className="text-white">
                        {new Date(config.created_at).toLocaleDateString()}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-slate-400">Last updated:</dt>
                      <dd className="text-white">
                        {new Date(config.updated_at).toLocaleDateString()}
                      </dd>
                    </div>
                  </dl>
                </div>
                
                <div className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 p-6 rounded-xl shadow-lg border border-emerald-500/20 hover:shadow-xl transition-all duration-300">
                  <h4 className="font-bold text-white mb-4 flex items-center">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full mr-2 animate-pulse" />
                    Statistics
                  </h4>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-slate-400">Total logs:</dt>
                      <dd className="text-white font-medium">{projectLogs.length}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-slate-400">Successful syncs:</dt>
                      <dd className="text-emerald-400 font-medium">
                        {projectLogs.filter(log => log.status === 'success').length}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-slate-400">Errors:</dt>
                      <dd className="text-red-400 font-medium">
                        {projectLogs.filter(log => log.status === 'error').length}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          )}
          
          {activeSection === 'logs' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-left duration-300">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-white flex items-center text-xl">
                  <TrendingUp className="w-6 h-6 text-blue-400 mr-3" />
                  Project Logs
                </h4>
                <div className="text-sm text-slate-400 bg-slate-800/50 px-4 py-2 rounded-full border border-slate-700/50">
                  {projectLogs.length} {projectLogs.length === 1 ? 'entry' : 'entries'}
                </div>
              </div>
              
              <div className="bg-slate-900/50 rounded-xl border border-slate-700/50 overflow-hidden">
                <LogsViewer
                  logs={projectLogs}
                  configs={[config]}
                  onRefresh={onRefreshLogs}
                  loading={loading}
                  showConfigFilter={false}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
export default ProjectTab
