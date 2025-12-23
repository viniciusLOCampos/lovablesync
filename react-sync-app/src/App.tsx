import { useState, useEffect } from 'react'
import { Github, Key, AlertCircle, CheckCircle } from 'lucide-react'
import type { SyncConfig, CreateSyncConfig, UpdateSyncConfig, SyncLog, SyncProgress } from './types'
import { githubAuth } from './services/auth'
import { supabaseService } from './services/supabase'
import { githubSync } from './services/github'
import TabSystem from './components/TabSystem'
import ProjectTab from './components/ProjectTab'
import SyncConfigForm from './components/SyncConfigForm'

function App() {
  // Estado da aplicação
  const [activeTabId, setActiveTabId] = useState<string>('new')
  const [githubToken, setGithubToken] = useState<string>('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userInfo, setUserInfo] = useState<{ username: string; email?: string } | null>(null)

  // Estados dos dados
  const [configs, setConfigs] = useState<SyncConfig[]>([])
  const [logs, setLogs] = useState<SyncLog[]>([])
  const [syncProgress, setSyncProgress] = useState<SyncProgress[]>([])

  // Estados de UI
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showConfigForm, setShowConfigForm] = useState(false)
  const [editingConfig, setEditingConfig] = useState<SyncConfig | undefined>(undefined)
  const [syncingConfigs, setSyncingConfigs] = useState<string[]>([])

  // Verificar autenticação ao carregar
  useEffect(() => {
    const savedToken = localStorage.getItem('github_token')
    if (savedToken) {
      handleTokenSubmit(savedToken)
    }
  }, [])

  // Carregar dados quando autenticado
  useEffect(() => {
    if (isAuthenticated) {
      testSupabaseConnection()
      loadConfigs()
      loadLogs()
    }
  }, [isAuthenticated])

  // Testar conectividade com Supabase
  const testSupabaseConnection = async () => {
    try {
      const isConnected = await supabaseService.testConnection()
      if (!isConnected) {
        setError('Falha na conexão com o banco de dados. Verifique a configuração do Supabase.')
        console.error('Supabase não está acessível')
      } else {
        console.log('Conexão com Supabase estabelecida com sucesso')
      }
    } catch (error) {
      console.error('Erro ao testar conexão com Supabase:', error)
      setError('Erro ao conectar com o banco de dados')
    }
  }

  // Atualizar aba ativa quando configs mudam
  useEffect(() => {
    if (configs.length > 0 && activeTabId === 'new') {
      setActiveTabId(configs[0].id)
    }
  }, [configs, activeTabId])

  const handleTokenSubmit = async (token: string) => {
    setLoading(true)
    setError(null)

    try {
      const validation = await githubAuth.validateToken(token)

      if (validation.valid) {
        githubAuth.setToken(token)
        setGithubToken(token)
        setIsAuthenticated(true)
        localStorage.setItem('github_token', token)

        // Obter informações do usuário
        const user = await githubAuth.getUserInfo()
        setUserInfo(user)
      } else {
        setError(validation.error || 'Token inválido')
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      setError('Erro ao validar token: ' + errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    githubAuth.logout()
    setGithubToken('')
    setIsAuthenticated(false)
    setUserInfo(null)
    setConfigs([])
    setLogs([])
    setSyncProgress([])
    localStorage.removeItem('github_token')
  }

  const loadConfigs = async () => {
    try {
      const configsData = await supabaseService.getConfigs()
      setConfigs(configsData)
    } catch (error: unknown) {
      console.error('Erro ao carregar configurações:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      setError('Erro ao carregar configurações: ' + errorMessage)
    }
  }

  const loadLogs = async () => {
    try {
      const logsData = await supabaseService.getLogs()
      setLogs(logsData)
    } catch (error: unknown) {
      console.error('Erro ao carregar logs:', error)
    }
  }

  const handleSaveConfig = async (configData: CreateSyncConfig | UpdateSyncConfig): Promise<void> => {
    try {
      let newConfigId: string

      if (editingConfig) {
        // Atualizar configuração existente
        await supabaseService.updateConfig(editingConfig.id, configData as UpdateSyncConfig)
        newConfigId = editingConfig.id
      } else {
        // Criar nova configuração
        const newConfig = await supabaseService.createConfig(configData as CreateSyncConfig)
        newConfigId = newConfig.id
      }

      await loadConfigs()
      setShowConfigForm(false)
      setEditingConfig(undefined)

      // Mudar para a aba do projeto criado/editado
      setActiveTabId(newConfigId)
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      throw new Error(editingConfig ? 'Erro ao atualizar configuração: ' + errorMessage : 'Erro ao criar configuração: ' + errorMessage)
    }
  }

  const handleDeleteConfig = async (config: SyncConfig) => {
    try {
      await supabaseService.deleteConfig(config.id)
      await loadConfigs()

      // Se a aba deletada estava ativa, mudar para outra aba
      if (activeTabId === config.id) {
        const remainingConfigs = configs.filter(c => c.id !== config.id)
        setActiveTabId(remainingConfigs.length > 0 ? remainingConfigs[0].id : 'new')
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      setError('Erro ao deletar configuração: ' + errorMessage)
    }
  }

  const handleToggleEnabled = async (config: SyncConfig) => {
    try {
      await supabaseService.updateConfig(config.id, { auto_sync: !config.auto_sync })
      await loadConfigs()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      setError('Erro ao atualizar configuração: ' + errorMessage)
    }
  }

  const handleUpdateConfig = (updatedConfig: SyncConfig) => {
    setConfigs(prev => prev.map(config =>
      config.id === updatedConfig.id ? updatedConfig : config
    ))
  }

  const handleSync = async (config: SyncConfig) => {
    if (syncingConfigs.includes(config.id)) return

    setSyncingConfigs(prev => [...prev, config.id])

    // Adicionar progresso inicial
    const initialProgress: SyncProgress = {
      configId: config.id,
      configName: config.name,
      status: 'in_progress',
      currentStep: 'deleting',
      filesProcessed: 0,
      totalFiles: 0,
      progress: 0,
      message: 'Iniciando sincronização...'
    }
    setSyncProgress(prev => [...prev.filter(p => p.configId !== config.id), initialProgress])

    try {
      // Log de início
      await supabaseService.createLog({
        config_id: config.id,
        status: 'in_progress',
        message: 'Sincronização iniciada'
      })

      // Executar sincronização
      const [sourceOwner, sourceRepo] = config.source_path.split('/')
      const [targetOwner, targetRepo] = config.target_repo.split('/')

      const result = await githubSync.syncRepositories(
        sourceOwner,
        sourceRepo,
        targetOwner,
        targetRepo,
        (progress) => {
          setSyncProgress(prev => [
            ...prev.filter(p => p.configId !== config.id),
            { ...progress, configId: config.id, configName: config.name }
          ])
        }
      )

      // Log de resultado
      await supabaseService.createLog({
        config_id: config.id,
        status: result.success ? 'success' : 'error',
        message: result.success
          ? `Sincronização concluída com sucesso. ${result.filesProcessed} arquivos processados em ${Math.round(result.duration / 1000)}s`
          : `Erro na sincronização: ${result.error}`,
        files_changed: result.filesProcessed
      })

      // Atualizar progresso final
      setSyncProgress(prev => [
        ...prev.filter(p => p.configId !== config.id),
        {
          configId: config.id,
          configName: config.name,
          status: result.success ? 'success' : 'error',
          currentStep: result.success ? 'completed' : 'error',
          filesProcessed: result.filesProcessed,
          totalFiles: result.filesProcessed,
          progress: result.success ? 100 : 0,
          message: result.success
            ? `Sincronização concluída! ${result.filesProcessed} arquivos processados.`
            : `Erro: ${result.error}`
        }
      ])

      // Recarregar logs
      await loadLogs()

    } catch (error: unknown) {
      console.error('Erro na sincronização:', error)

      // Log de erro
      await supabaseService.createLog({
        config_id: config.id,
        status: 'error',
        message: `Erro na sincronização: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      })

      // Atualizar progresso com erro
      setSyncProgress(prev => [
        ...prev.filter(p => p.configId !== config.id),
        {
          configId: config.id,
          configName: config.name,
          status: 'error',
          currentStep: 'error',
          filesProcessed: 0,
          totalFiles: 0,
          progress: 0,
          message: `Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
        }
      ])

      await loadLogs()
    } finally {
      setSyncingConfigs(prev => prev.filter(id => id !== config.id))

      // Remover progresso após 5 segundos
      setTimeout(() => {
        setSyncProgress(prev => prev.filter(p => p.configId !== config.id))
      }, 5000)
    }
  }

  const handleCreateNew = () => {
    // Criar um exemplo de configuração
    const exampleConfig: CreateSyncConfig = {
      name: 'Exemplo de Projeto',
      source_path: 'usuario/repositorio-origem',
      target_repo: 'usuario/repositorio-destino',
      target_branch: 'main',
      auto_sync: true
    }

    // Definir como configuração de edição para pré-preencher o formulário
    setEditingConfig({
      id: 'temp-example',
      ...exampleConfig,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    } as SyncConfig)
    setShowConfigForm(true)
  }

  const handleCloseTab = (tabId: string) => {
    const config = configs.find(c => c.id === tabId)
    if (config) {
      handleDeleteConfig(config)
    }
  }

  const getCurrentConfig = () => {
    return configs.find(config => config.id === activeTabId)
  }

  const getCurrentProgress = () => {
    return syncProgress.find(progress => progress.configId === activeTabId) || null
  }

  // Tela de autenticação
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950 flex items-center justify-center relative overflow-hidden">
        {/* Ultra Premium Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.15),transparent_70%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(139,92,246,0.12),transparent_70%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(16,185,129,0.08),transparent_70%)]" />
          <div className="absolute inset-0 bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0deg,rgba(59,130,246,0.03)_60deg,transparent_120deg)] animate-spin" style={{ animationDuration: '60s' }} />
          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_48%,rgba(255,255,255,0.01)_49%,rgba(255,255,255,0.01)_51%,transparent_52%)] bg-[length:40px_40px]" />
        </div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-10 w-24 h-24 bg-emerald-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }} />

        <div className="w-full max-w-xl bg-white/[0.03] backdrop-blur-3xl border border-white/[0.08] rounded-3xl shadow-2xl relative z-10 overflow-hidden">
          {/* Advanced Glassmorphism */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.12] via-white/[0.03] to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-tl from-blue-500/[0.08] via-transparent to-purple-500/[0.05]" />

          <div className="relative p-14">
            <div className="text-center mb-12">
              <div className="relative mb-10">
                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/30 relative group">
                  <Github className="w-12 h-12 text-white group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-br from-white/25 via-white/10 to-transparent rounded-3xl" />
                  <div className="absolute -inset-1 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-3xl blur opacity-30 group-hover:opacity-50 transition-opacity duration-500" />
                </div>
                <div className="absolute inset-0 w-24 h-24 mx-auto bg-blue-500/20 rounded-3xl blur-2xl animate-pulse" />
              </div>
              <h1 className="text-5xl font-black text-white mb-4 tracking-tight bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
                GitHub Repository Sync
              </h1>
              <p className="text-slate-300 text-xl font-semibold mb-2">
                Enterprise-grade repository synchronization
              </p>
              <p className="text-slate-500 text-sm font-medium">
                Powered by advanced AI-driven sync technology
              </p>
            </div>

            {error && (
              <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl backdrop-blur-sm animate-in slide-in-from-top duration-300">
                <div className="flex items-center">
                  <div className="p-2 bg-red-500/20 rounded-xl mr-3">
                    <AlertCircle className="w-4 h-4 text-red-400" />
                  </div>
                  <span className="text-red-300 text-sm font-medium">{error}</span>
                </div>
              </div>
            )}

            <form onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              const token = formData.get('token') as string
              if (token) handleTokenSubmit(token)
            }}>
              <div className="mb-10">
                <label htmlFor="token" className="block text-base font-bold text-slate-200 mb-6 flex items-center">
                  <div className="p-2 bg-blue-500/20 rounded-xl mr-3 shadow-lg">
                    <Key className="w-5 h-5 text-blue-300" />
                  </div>
                  GitHub Personal Access Token
                </label>
                <div className="relative group">
                  <input
                    type="password"
                    id="token"
                    name="token"
                    value={githubToken}
                    onChange={(e) => setGithubToken(e.target.value)}
                    className="w-full px-8 py-5 bg-white/[0.04] border border-white/[0.12] rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400/60 focus:border-blue-400/60 transition-all duration-500 backdrop-blur-xl group-hover:bg-white/[0.06] group-hover:border-white/[0.15] text-lg font-medium shadow-xl"
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                    required
                    autoFocus
                  />
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/[0.03] via-purple-500/[0.02] to-indigo-500/[0.03] pointer-events-none" />
                  <div className="absolute inset-0 rounded-2xl shadow-inner" />
                </div>
                <div className="mt-6 p-5 bg-gradient-to-r from-blue-500/[0.08] via-blue-600/[0.06] to-indigo-500/[0.08] rounded-2xl border border-blue-500/[0.15] backdrop-blur-sm">
                  <div className="text-sm text-blue-200 font-semibold flex items-center">
                    <div className="p-2 bg-blue-400/20 rounded-lg mr-3">
                      <Github className="w-4 h-4 text-blue-300" />
                    </div>
                    <span>Create token at: <span className="text-blue-100 font-bold">GitHub → Settings → Developer settings → Personal access tokens</span></span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !githubToken.trim()}
                className="group w-full flex items-center justify-center px-10 py-6 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 text-white rounded-2xl hover:from-blue-500 hover:via-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-blue-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-500 shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/50 hover:shadow-2xl font-bold text-xl relative overflow-hidden transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/15 via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                {loading ? (
                  <>
                    <div className="animate-spin w-6 h-6 border-3 border-white border-t-transparent rounded-full mr-4" />
                    <span className="tracking-wide">Authenticating...</span>
                  </>
                ) : (
                  <>
                    <div className="p-2 bg-white/20 rounded-xl mr-4 group-hover:bg-white/30 transition-all duration-300">
                      <Key className="w-6 h-6 group-hover:rotate-12 transition-transform duration-500" />
                    </div>
                    <span className="tracking-wide">Connect to GitHub</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  // Interface principal
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950 text-white relative overflow-hidden">
      {/* Premium Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(59,130,246,0.08),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(139,92,246,0.06),transparent_50%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_48%,rgba(255,255,255,0.005)_49%,rgba(255,255,255,0.005)_51%,transparent_52%)] bg-[length:60px_60px]" />
      </div>

      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-80 bg-gray-950/98 backdrop-blur-2xl border-r border-white/[0.12] z-50 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.08] via-white/[0.02] to-transparent" />
        <div className="relative p-8">
          {/* Logo */}
          <div className="flex items-center mb-10">
            <div className="p-4 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 rounded-2xl mr-4 shadow-2xl shadow-blue-500/25 relative group">
              <Github className="w-8 h-8 text-white group-hover:scale-110 transition-transform duration-300" />
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">GitHub Sync</h1>
              <p className="text-sm text-blue-300 font-semibold">Enterprise Edition</p>
            </div>
          </div>

          {/* User Info */}
          <div className="mb-10 p-6 bg-white/[0.04] rounded-2xl border border-white/[0.12] backdrop-blur-sm shadow-xl">
            <div className="flex items-center">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 via-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mr-4 shadow-lg relative">
                <span className="text-lg font-black text-white">{userInfo?.username?.charAt(0).toUpperCase()}</span>
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl" />
              </div>
              <div className="flex-1">
                <p className="text-lg font-bold text-white">{userInfo?.username}</p>
                <div className="flex items-center mt-1">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full mr-2 animate-pulse" />
                  <p className="text-sm text-emerald-300 font-semibold">Connected</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-3 text-slate-400 hover:text-red-400 hover:bg-red-500/15 rounded-xl transition-all duration-300 group"
                title="Disconnect"
              >
                <CheckCircle className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-3">
            <div className="text-sm font-black text-slate-300 uppercase tracking-widest mb-6 flex items-center">
              <div className="w-1 h-6 bg-gradient-to-b from-blue-400 to-indigo-600 rounded-full mr-3" />
              Projects
            </div>
            {/* Projects will be rendered here */}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-80 relative">
        {/* Header */}
        <header className="h-20 bg-white/[0.03] backdrop-blur-2xl border-b border-white/[0.12] flex items-center justify-between px-10 shadow-xl relative">
          <div className="absolute inset-0 bg-gradient-to-r from-white/[0.05] via-white/[0.02] to-transparent" />
          <div className="relative">
            <h2 className="text-2xl font-black text-white tracking-tight">Repository Synchronization</h2>
            <p className="text-base text-slate-300 font-semibold mt-1">Manage your sync configurations with enterprise precision</p>
          </div>
          <div className="flex items-center space-x-6 relative">
            <div className="flex items-center space-x-3 text-base text-slate-300 bg-white/[0.05] px-4 py-2 rounded-xl border border-white/[0.08] backdrop-blur-sm">
              <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/50"></div>
              <span className="font-semibold">System Online</span>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-300 cursor-pointer">
              <Github className="w-6 h-6 text-white" />
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-10 relative">
          {/* Tab System */}
          <TabSystem
            configs={configs}
            activeTabId={activeTabId}
            onTabChange={setActiveTabId}
            onCreateNew={handleCreateNew}
            onCloseTab={handleCloseTab}
          />

          {/* Main Content */}
          <main className="mt-6">
            {error && (
              <div className="mb-8 p-6 bg-red-500/10 border border-red-500/20 rounded-2xl backdrop-blur-sm animate-in slide-in-from-top duration-300">
                <div className="flex items-center">
                  <div className="p-2 bg-red-500/20 rounded-xl mr-4">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                  </div>
                  <div className="flex-1">
                    <span className="text-red-300 font-semibold">{error}</span>
                    <button
                      onClick={() => setError(null)}
                      className="ml-6 text-red-400 hover:text-red-300 text-sm font-medium px-3 py-1 rounded-lg hover:bg-red-500/10 transition-all duration-200"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Active tab content */}
            {activeTabId === 'new' ? (
              <div className="flex items-center justify-center py-24">
                <div className="text-center max-w-2xl">
                  <div className="p-12 bg-white/[0.04] rounded-3xl border border-white/[0.12] backdrop-blur-xl shadow-2xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] via-white/[0.02] to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-tl from-blue-500/[0.05] via-transparent to-purple-500/[0.03]" />

                    <div className="relative">
                      <div className="w-28 h-28 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-blue-500/30 relative group">
                        <Github className="w-14 h-14 text-white group-hover:scale-110 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-br from-white/25 via-white/10 to-transparent rounded-3xl" />
                        <div className="absolute -inset-2 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500" />
                      </div>
                      <h2 className="text-4xl font-black text-white mb-6 tracking-tight bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">Welcome to GitHub Sync</h2>
                      <p className="text-slate-300 mb-4 leading-relaxed text-xl font-semibold">
                        Create your first project to start synchronizing repositories
                      </p>
                      <p className="text-slate-400 mb-10 leading-relaxed text-lg">
                        with enterprise-grade reliability and AI-powered precision.
                      </p>
                      <button
                        onClick={handleCreateNew}
                        className="group inline-flex items-center px-10 py-5 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white rounded-2xl font-bold shadow-2xl hover:shadow-blue-500/40 transition-all duration-500 hover:from-blue-500 hover:via-blue-600 hover:to-indigo-600 transform hover:scale-105 text-xl relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/15 via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="p-2 bg-white/20 rounded-xl mr-4 group-hover:bg-white/30 transition-all duration-300">
                          <Github className="w-6 h-6 group-hover:rotate-12 transition-transform duration-500" />
                        </div>
                        <span className="tracking-wide">Create First Project</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              getCurrentConfig() && (
                <ProjectTab
                  config={getCurrentConfig()!}
                  logs={logs}
                  progress={getCurrentProgress()}
                  onEdit={(config) => {
                    setEditingConfig(config)
                    setShowConfigForm(true)
                  }}
                  onDelete={handleDeleteConfig}
                  onSync={handleSync}
                  onToggleEnabled={handleToggleEnabled}
                  onUpdateConfig={handleUpdateConfig}
                  isSyncing={syncingConfigs.includes(getCurrentConfig()!.id)}
                  onRefreshLogs={loadLogs}
                  loading={loading}
                />
              )
            )}
          </main>
        </div>

        {/* Config Form Modal */}
        {showConfigForm && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-xl flex items-center justify-center p-6 z-50 animate-in fade-in duration-300">
            <div className="bg-gray-950/98 backdrop-blur-2xl border border-white/[0.15] rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto relative">
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] via-white/[0.02] to-transparent rounded-3xl" />
              <div className="absolute inset-0 bg-gradient-to-tl from-blue-500/[0.08] via-transparent to-purple-500/[0.05] rounded-3xl" />
              <div className="relative">
                <SyncConfigForm
                  config={editingConfig}
                  onSave={handleSaveConfig}
                  onCancel={() => {
                    setShowConfigForm(false)
                    setEditingConfig(undefined)
                  }}
                  isOpen={showConfigForm}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
