import React from 'react'
import { ChevronDown, Github } from 'lucide-react'
import type { GitHubRepo } from '../types'

interface BasicRepositoryDropdownProps {
  value: string | null
  repositories: GitHubRepo[]
  loading: boolean
  isOpen: boolean
  onToggle: () => void
  onSelect: (repoFullName: string) => void
  colorScheme: 'blue' | 'emerald'
  placeholder: string
}

const BasicRepositoryDropdown: React.FC<BasicRepositoryDropdownProps> = ({
  value,
  repositories,
  loading,
  isOpen,
  onToggle,
  onSelect,
  colorScheme,
  placeholder
}) => {
  const colorClasses = {
    blue: {
      button: 'border-blue-300 focus:border-blue-500 focus:ring-blue-500',
      dropdown: 'border-blue-200',
      item: 'hover:bg-blue-50'
    },
    emerald: {
      button: 'border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500',
      dropdown: 'border-emerald-200',
      item: 'hover:bg-emerald-50'
    }
  }

  const selectedRepo = repositories.find(repo => repo.full_name === value)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className={`w-full px-3 py-2 text-left bg-white border rounded-md shadow-sm focus:outline-none focus:ring-1 ${colorClasses[colorScheme].button} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        disabled={loading}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Github className="h-4 w-4 text-gray-400" />
            <span className={selectedRepo ? 'text-gray-900' : 'text-gray-500'}>
              {loading ? 'Carregando...' : (selectedRepo?.full_name || placeholder)}
            </span>
            {selectedRepo?.private && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                Privado
              </span>
            )}
          </div>
          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isOpen && !loading && (
        <div className={`absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-auto ${colorClasses[colorScheme].dropdown}`}>
          {repositories.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">
              Nenhum repositório encontrado
            </div>
          ) : (
            repositories.map((repo) => (
              <button
                key={repo.id}
                type="button"
                onClick={() => {
                  onSelect(repo.full_name)
                }}
                className={`w-full px-3 py-2 text-left text-sm ${colorClasses[colorScheme].item} ${repo.full_name === value ? 'bg-gray-100' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Github className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-900">{repo.full_name}</span>
                  </div>
                  {repo.private && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                      Privado
                    </span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default BasicRepositoryDropdown