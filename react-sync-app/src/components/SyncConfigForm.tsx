import React, { useState, useEffect } from 'react'
import { Save, X, AlertCircle, Check, Github, Sparkles, Zap } from 'lucide-react'
import type { SyncConfig, CreateSyncConfig, UpdateSyncConfig, GitHubRepo } from '../types'
import { githubAuth } from '../services/auth'
import { supabaseService } from '../services/supabase'
import RepositoryDropdown from './RepositoryDropdown'

interface SyncConfigFormProps {
  config?: SyncConfig
  onSave: (config: CreateSyncConfig | UpdateSyncConfig) => Promise<void>
  onCancel: () => void
  isOpen: boolean
}

export default function SyncConfigForm({ config, onSave, onCancel, isOpen }: SyncConfigFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    sourceRepo: '',
    targetRepo: '',
    targetBranch: 'main',
    autoSync: true
  })
  const [repositories, setRepositories] = useState<GitHubRepo[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingRepos, setLoadingRepos] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [validationStatus, setValidationStatus] = useState<Record<string, 'validating' | 'valid' | 'invalid'>>({})

  // Carregar dados do formulário quando o config muda
  useEffect(() => {
    if (config) {
      setFormData({
        name: config.name,
        sourceRepo: config.source_path,
        targetRepo: config.target_repo,
        targetBranch: config.target_branch,
        autoSync: config.auto_sync
      })
    } else {
      setFormData({
        name: '',
        sourceRepo: '',
        targetRepo: '',
        targetBranch: 'main',
        autoSync: true
      })
    }
    setErrors({})
    setValidationStatus({})
  }, [config])

  // Carregar repositórios quando o formulário abre
  useEffect(() => {
    if (isOpen && githubAuth.isAuthenticated()) {
      loadRepositories()
    }
  }, [isOpen])

  const loadRepositories = async () => {
    setLoadingRepos(true)
    try {
      const repos = await githubAuth.getUserRepositories()
      setRepositories(repos)
    } catch (error: unknown) {
      console.error('Erro ao carregar repositórios:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      setErrors({ general: 'Erro ao carregar repositórios: ' + errorMessage })
    } finally {
      setLoadingRepos(false)
    }
  }

  const validateRepository = async (repoFullName: string, field: 'sourceRepo' | 'targetRepo') => {
    if (!repoFullName.includes('/')) {
      setValidationStatus(prev => ({ ...prev, [field]: 'invalid' }))
      setErrors(prev => ({ ...prev, [field]: 'Formato inválido. Use: owner/repository' }))
      return
    }

    setValidationStatus(prev => ({ ...prev, [field]: 'validating' }))
    setErrors(prev => ({ ...prev, [field]: '' }))

    try {
      const [owner, repo] = repoFullName.split('/')
      const result = await githubAuth.validateRepository(owner, repo)
      
      if (result.valid) {
        setValidationStatus(prev => ({ ...prev, [field]: 'valid' }))
      } else {
        setValidationStatus(prev => ({ ...prev, [field]: 'invalid' }))
        setErrors(prev => ({ ...prev, [field]: result.error || 'Repositório inválido' }))
      }
    } catch {
      setValidationStatus(prev => ({ ...prev, [field]: 'invalid' }))
      setErrors(prev => ({ ...prev, [field]: 'Erro ao validar repositório' }))
    }
  }

  const validateForm = async (): Promise<boolean> => {
    const newErrors: Record<string, string> = {}

    // Validar nome
    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório'
    } else {
      // Verificar se o nome já existe
      try {
        const exists = await supabaseService.configNameExists(formData.name, config?.id)
        if (exists) {
          newErrors.name = 'Já existe uma configuração com este nome'
        }
      } catch (error) {
        console.error('Erro ao verificar nome:', error)
      }
    }

    // Validar repositório de origem
    if (!formData.sourceRepo.trim()) {
      newErrors.sourceRepo = 'Repositório de origem é obrigatório'
    } else if (!formData.sourceRepo.includes('/')) {
      newErrors.sourceRepo = 'Formato inválido. Use: owner/repository'
    }

    // Validar repositório de destino
    if (!formData.targetRepo.trim()) {
      newErrors.targetRepo = 'Repositório de destino é obrigatório'
    } else if (!formData.targetRepo.includes('/')) {
      newErrors.targetRepo = 'Formato inválido. Use: owner/repository'
    }

    // Verificar se os repositórios são diferentes
    if (formData.sourceRepo === formData.targetRepo) {
      newErrors.targetRepo = 'Repositório de destino deve ser diferente do de origem'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const isValid = await validateForm()
    if (!isValid) return

    setLoading(true)
    try {
      const configData = {
        name: formData.name.trim(),
        source_path: formData.sourceRepo.trim(),
        target_repo: formData.targetRepo.trim(),
        target_branch: formData.targetBranch.trim(),
        auto_sync: formData.autoSync
      }

      await onSave(configData)
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      setErrors({ general: errorMessage })
    } finally {
      setLoading(false)
    }
  }

  const getValidationIcon = (field: 'sourceRepo' | 'targetRepo') => {
    const status = validationStatus[field]
    if (status === 'validating') {
      return <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" />
    }
    if (status === 'valid') {
      return <Check className="w-4 h-4 text-green-500" />
    }
    if (status === 'invalid') {
      return <AlertCircle className="w-4 h-4 text-red-500" />
    }
    return null
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-2xl flex items-center justify-center p-6 z-50 animate-in fade-in duration-500">
      <div className="bg-gray-950/95 backdrop-blur-3xl rounded-3xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto border border-white/[0.15] animate-in zoom-in-95 slide-in-from-bottom-4 duration-500 relative">
        {/* Background Gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.12] via-white/[0.03] to-transparent rounded-3xl" />
        <div className="absolute inset-0 bg-gradient-to-tl from-blue-500/[0.15] via-transparent to-purple-500/[0.08] rounded-3xl" />
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-96 h-32 bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-pink-400/20 blur-3xl" />
        
        <div className="relative">
          <div className="flex items-center justify-between p-10 border-b border-white/[0.15] bg-gradient-to-r from-gray-900/80 via-gray-800/60 to-gray-900/80 backdrop-blur-xl">
            <div className="flex items-center space-x-6">
              <div className="p-4 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 rounded-3xl shadow-2xl shadow-blue-500/40 relative group">
                <Github className="w-8 h-8 text-white group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-white/10 to-transparent rounded-3xl" />
                <div className="absolute -inset-1 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-3xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity duration-500" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-white flex items-center tracking-tight">
                  <span className="bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
                    {config ? 'Edit Configuration' : 'New Configuration'}
                  </span>
                  <Sparkles className="w-7 h-7 ml-4 text-blue-400 animate-pulse" />
                </h2>
                <p className="text-slate-300 text-lg font-medium mt-1">Configure your repository synchronization</p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="group p-4 text-slate-400 hover:text-red-400 transition-all duration-500 rounded-2xl hover:bg-red-500/15 hover:shadow-2xl transform hover:scale-110 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />
              <X className="w-7 h-7 group-hover:rotate-90 transition-transform duration-500 relative z-10" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-12 space-y-10">
            {errors.general && (
              <div className="bg-red-500/15 border border-red-500/30 rounded-3xl p-8 shadow-2xl animate-in slide-in-from-top duration-500 backdrop-blur-xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-red-400/5 to-red-500/10" />
                <div className="flex items-center relative z-10">
                  <div className="p-3 bg-red-500 rounded-2xl mr-6 shadow-lg shadow-red-500/40">
                    <AlertCircle className="w-6 h-6 text-white animate-pulse" />
                  </div>
                  <span className="text-red-200 font-bold text-xl">{errors.general}</span>
                </div>
              </div>
            )}

            {/* Configuration Name */}
            <div className="group">
              <label htmlFor="name" className="block text-xl font-black text-white mb-6 flex items-center">
                <div className="p-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl mr-4 shadow-lg shadow-yellow-500/30">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <span className="bg-gradient-to-r from-white via-yellow-100 to-white bg-clip-text text-transparent">
                  Configuration Name
                </span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className={`w-full px-8 py-6 border-2 rounded-3xl shadow-2xl focus:outline-none transition-all duration-500 text-white text-xl backdrop-blur-xl relative overflow-hidden ${
                    errors.name 
                      ? 'border-red-500/60 bg-red-500/15 focus:border-red-400 focus:ring-4 focus:ring-red-500/30 shadow-red-500/20' 
                      : 'border-white/[0.15] bg-white/[0.05] focus:border-blue-500 focus:ring-4 focus:ring-blue-500/30 hover:border-white/[0.25] shadow-blue-500/10'
                  }`}
                  placeholder="e.g., Sync Project A to B"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-white/[0.05] via-transparent to-white/[0.05] pointer-events-none rounded-3xl" />
                {formData.name && (
                  <div className="absolute right-6 top-1/2 transform -translate-y-1/2">
                    <div className="p-2 bg-green-500 rounded-xl shadow-lg shadow-green-500/40">
                      <Check className="w-5 h-5 text-white animate-bounce" />
                    </div>
                  </div>
                )}
              </div>
              {errors.name && (
                <p className="mt-4 text-base text-red-200 flex items-center animate-in slide-in-from-left duration-500 bg-red-500/10 p-4 rounded-2xl border border-red-500/20">
                  <AlertCircle className="w-5 h-5 mr-3" />
                  {errors.name}
                </p>
              )}
            </div>

          <RepositoryDropdown
            label="Source Repository"
            value={formData.sourceRepo}
            repositories={repositories}
            loading={loadingRepos}
            onSelect={(repoFullName) => {
              setFormData(prev => ({ ...prev, sourceRepo: repoFullName }))
              validateRepository(repoFullName, 'sourceRepo')
            }}
            colorScheme="blue"
            placeholder="owner/repository"
            error={errors.sourceRepo}
            validationStatus={validationStatus.sourceRepo}
            validationIcon={getValidationIcon('sourceRepo')}
            allowManualInput
            onManualInputChange={(value) => {
              setFormData(prev => ({ ...prev, sourceRepo: value }))
              if (value.includes('/')) {
                validateRepository(value, 'sourceRepo')
              }
            }}
          />

          <RepositoryDropdown
            label="Target Repository"
            value={formData.targetRepo}
            repositories={repositories}
            loading={loadingRepos}
            onSelect={(repoFullName) => {
              setFormData(prev => ({ ...prev, targetRepo: repoFullName }))
              validateRepository(repoFullName, 'targetRepo')
            }}
            colorScheme="emerald"
            placeholder="owner/repository"
            error={errors.targetRepo}
            validationStatus={validationStatus.targetRepo}
            validationIcon={getValidationIcon('targetRepo')}
            allowManualInput
            onManualInputChange={(value) => {
              setFormData(prev => ({ ...prev, targetRepo: value }))
              if (value.includes('/')) {
                validateRepository(value, 'targetRepo')
              }
            }}
          />

          {/* Enable Configuration */}
          <div className="group flex items-center p-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl border-2 border-white/[0.08] shadow-lg backdrop-blur-sm">
            <div className="relative">
              <input
                type="checkbox"
                id="autoSync"
                checked={formData.autoSync}
                onChange={(e) => setFormData(prev => ({ ...prev, autoSync: e.target.checked }))}
                className="h-6 w-6 text-blue-600 focus:ring-blue-500 border-white/[0.12] bg-white/[0.05] rounded-lg transition-all duration-300 transform hover:scale-110"
              />
              {formData.autoSync && (
                <div className="absolute inset-0 animate-ping h-6 w-6 bg-blue-400 rounded-lg opacity-30" />
              )}
            </div>
            <label htmlFor="autoSync" className="ml-4 block text-lg font-bold text-white flex items-center">
              <Zap className={`w-5 h-5 mr-3 transition-colors duration-300 ${
                formData.autoSync ? 'text-green-400' : 'text-slate-400'
              }`} />
              Auto Sync Configuration
              {formData.autoSync && (
                <span className="ml-3 text-xs bg-green-500/20 text-green-300 px-3 py-1 rounded-full font-medium animate-pulse border border-green-500/30">
                  Active
                </span>
              )}
            </label>
          </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-8 pt-12 border-t-2 border-white/[0.15] bg-gradient-to-r from-gray-900/30 via-gray-800/20 to-gray-900/30 backdrop-blur-xl rounded-3xl p-8 mt-8">
              <button
                type="button"
                onClick={onCancel}
                className="group px-12 py-6 text-xl font-black text-slate-200 bg-white/[0.05] border-2 border-white/[0.15] rounded-3xl hover:bg-white/[0.10] hover:border-white/[0.25] focus:outline-none focus:ring-4 focus:ring-slate-500/30 transition-all duration-500 transform hover:scale-105 active:scale-95 shadow-2xl backdrop-blur-xl relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/[0.08] via-transparent to-white/[0.08] opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl" />
                <span className="flex items-center relative z-10">
                  <div className="p-2 bg-slate-600 rounded-xl mr-4 group-hover:bg-slate-500 transition-all duration-300">
                    <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500" />
                  </div>
                  Cancel
                </span>
              </button>
              <button
                type="submit"
                disabled={loading || loadingRepos}
                className="group relative px-16 py-6 text-xl font-black text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 border-2 border-transparent rounded-3xl hover:from-blue-500 hover:via-indigo-500 hover:to-purple-600 focus:outline-none focus:ring-4 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-500 transform hover:scale-105 active:scale-95 shadow-2xl hover:shadow-blue-500/40 overflow-hidden"
              >
                {/* Multiple Shine Effects */}
                <div className="absolute inset-0 bg-gradient-to-r from-white/25 via-white/10 to-white/25 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 via-transparent to-purple-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-8 bg-gradient-to-r from-transparent via-white/30 to-transparent blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <span className="relative z-10 flex items-center">
                  {loading ? (
                    <>
                      <div className="p-2 bg-white/20 rounded-xl mr-4">
                        <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full" />
                      </div>
                      <div className="animate-pulse tracking-wide">Processing...</div>
                    </>
                  ) : (
                    <>
                      <div className="p-2 bg-white/20 rounded-xl mr-4 group-hover:bg-white/30 transition-all duration-300">
                        <Save className="w-6 h-6 group-hover:rotate-12 transition-transform duration-500" />
                      </div>
                      <span className="tracking-wide">{config ? 'Update Configuration' : 'Create Configuration'}</span>
                      <Sparkles className="w-6 h-6 ml-4 animate-pulse" />
                    </>
                  )}
                </span>
                
                {!loading && (
                  <>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-400 rounded-full animate-ping" />
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
