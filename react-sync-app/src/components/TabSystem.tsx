import { useState } from 'react'
import { Plus, X, Github, Pause } from 'lucide-react'
import type { SyncConfig } from '../types'

interface Tab {
  id: string
  type: 'project' | 'new'
  config?: SyncConfig
  title: string
}

interface TabSystemProps {
  configs: SyncConfig[]
  activeTabId: string
  onTabChange: (tabId: string) => void
  onCreateNew: () => void
  onCloseTab: (tabId: string) => void
}

const TabSystem = ({ configs, activeTabId, onTabChange, onCreateNew, onCloseTab }: TabSystemProps) => {
  const [hoveredTab, setHoveredTab] = useState<string | null>(null)

  // Criar abas baseadas nas configurações
  const tabs: Tab[] = [
    ...configs.map(config => ({
      id: config.id,
      type: 'project' as const,
      config,
      title: config.name
    })),
    {
      id: 'new',
      type: 'new' as const,
      title: 'New Project'
    }
  ]



  const getTabIcon = (tab: Tab) => {
    if (tab.type === 'new') {
      return <Plus className="w-4 h-4" />
    }
    
    // Ícones baseados no status do projeto
    if (tab.config?.enabled === false) {
      return <Pause className="w-4 h-4" />
    }
    
    return <Github className="w-4 h-4" />
  }

  const getTabStyles = (tab: Tab, isActive: boolean, isHovered: boolean) => {
    const baseStyles = 'relative flex items-center w-full px-6 py-4 rounded-2xl font-bold text-lg transition-all duration-500 group overflow-hidden backdrop-blur-2xl border transform hover:scale-[1.02]'
    
    if (tab.type === 'new') {
      if (isActive) {
        return `${baseStyles} bg-gray-950/90 border-emerald-400/30 text-white shadow-2xl shadow-emerald-500/40 hover:shadow-emerald-500/60`
      }
      return `${baseStyles} ${isHovered 
        ? 'bg-gray-950/70 border-emerald-400/20 text-emerald-300 shadow-xl shadow-emerald-500/20' 
        : 'bg-gray-950/50 border-white/[0.08] text-slate-400 hover:text-emerald-400 hover:border-emerald-400/20 hover:shadow-lg hover:shadow-emerald-500/10'}`
    }
    
    if (tab.config?.enabled === false) {
      if (isActive) {
        return `${baseStyles} bg-gray-950/90 border-slate-400/30 text-white shadow-2xl shadow-slate-500/40 hover:shadow-slate-500/60`
      }
      return `${baseStyles} ${isHovered
        ? 'bg-gray-950/70 border-slate-400/20 text-slate-300 shadow-xl shadow-slate-500/20'
        : 'bg-gray-950/50 border-white/[0.08] text-slate-500 hover:text-slate-400 hover:border-slate-400/20 hover:shadow-lg hover:shadow-slate-500/10'}`
    }
    
    if (isActive) {
      return `${baseStyles} bg-gray-950/90 border-blue-400/30 text-white shadow-2xl shadow-blue-500/40 hover:shadow-blue-500/60`
    }
    return `${baseStyles} ${isHovered
      ? 'bg-gray-950/70 border-blue-400/20 text-blue-300 shadow-xl shadow-blue-500/20'
      : 'bg-gray-950/50 border-white/[0.08] text-slate-400 hover:text-blue-400 hover:border-blue-400/20 hover:shadow-lg hover:shadow-blue-500/10'}`
  }

  const getStatusIndicator = (tab: Tab) => {
    if (tab.type === 'new') return null
    
    if (tab.config?.enabled === false) {
      return (
        <div className="flex items-center ml-auto">
          <div className="relative">
            <div className="w-4 h-4 bg-gradient-to-br from-orange-400 to-red-500 rounded-full animate-pulse shadow-lg shadow-orange-500/50" title="Project paused" />
            <div className="absolute inset-0 w-4 h-4 bg-orange-400/30 rounded-full animate-ping" />
          </div>
        </div>
      )
    }
    
    return (
      <div className="flex items-center ml-auto">
        <div className="relative">
          <div className="w-4 h-4 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full shadow-lg shadow-emerald-500/50" title="Project active" />
          <div className="absolute inset-0 w-4 h-4 bg-emerald-400/20 rounded-full animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Projects Header */}
      <div className="bg-gray-950/80 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/[0.15] p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.06] via-white/[0.02] to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-tl from-blue-500/[0.10] via-transparent to-purple-500/[0.06]" />
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 rounded-2xl shadow-lg shadow-blue-500/30">
              <Github className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-black text-white bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">Projects</h3>
          </div>
          <button
            onClick={onCreateNew}
            className="group p-4 bg-gradient-to-br from-emerald-500 via-emerald-600 to-green-600 text-white rounded-2xl hover:from-emerald-400 hover:via-emerald-500 hover:to-green-500 transition-all duration-500 shadow-2xl shadow-emerald-500/30 hover:shadow-emerald-500/50 transform hover:scale-110 active:scale-95"
            title="Create new project"
          >
            <div className="relative">
              <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
              <div className="absolute inset-0 w-6 h-6 bg-white/20 rounded-full animate-ping opacity-0 group-hover:opacity-100" />
            </div>
          </button>
        </div>
      </div>
      
      {/* Project Tabs */}
      <div className="space-y-4">
        {tabs.filter(tab => tab.type === 'project').map((tab) => {
          const isActive = activeTabId === tab.id
          const isHovered = hoveredTab === tab.id
          const canClose = tabs.filter(t => t.type === 'project').length > 1
          
          return (
            <div
              key={tab.id}
              className="relative group"
              onMouseEnter={() => setHoveredTab(tab.id)}
              onMouseLeave={() => setHoveredTab(null)}
            >
              <button
                onClick={() => onTabChange(tab.id)}
                className={getTabStyles(tab, isActive, isHovered)}
              >
                {/* Background gradients */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.06] via-white/[0.02] to-transparent rounded-2xl" />
                <div className="absolute inset-0 bg-gradient-to-tl from-blue-500/[0.08] via-transparent to-purple-500/[0.05] rounded-2xl" />
                
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-12 bg-gradient-to-b from-blue-400 via-indigo-500 to-purple-600 rounded-r-2xl shadow-lg shadow-blue-500/50" />
                )}
                
                <div className="relative z-10 flex items-center w-full">
                  <div className={`p-3 bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-2xl shadow-lg border border-white/[0.1] transition-transform duration-300 ${isHovered ? 'scale-110' : 'scale-100'}`}>
                    {getTabIcon(tab)}
                  </div>
                  
                  <span className="ml-4 truncate flex-1 text-left font-black bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">{tab.title}</span>
                  
                  {getStatusIndicator(tab)}
                </div>
                
                {/* Hover effect */}
                {isActive && (
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/[0.08] via-transparent to-white/[0.08]" />
                )}
              </button>
              
              {/* Close button */}
              {canClose && isHovered && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onCloseTab(tab.id)
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-gradient-to-br from-red-500 via-red-600 to-red-700 hover:from-red-400 hover:via-red-500 hover:to-red-600 text-white rounded-xl flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100 shadow-lg shadow-red-500/30 hover:shadow-red-500/50 transform hover:scale-110 active:scale-95"
                  title="Close project"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default TabSystem