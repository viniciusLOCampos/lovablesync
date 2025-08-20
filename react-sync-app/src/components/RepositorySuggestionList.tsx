import React from 'react'
import { Github } from 'lucide-react'
import type { GitHubRepo } from '../types'

interface RepositorySuggestionListProps {
  repositories: GitHubRepo[]
  onSelect: (repoFullName: string) => void
  colorScheme: 'blue' | 'emerald'
  title?: string
}

const RepositorySuggestionList: React.FC<RepositorySuggestionListProps> = ({
  repositories,
  onSelect,
  colorScheme,
  title = "Repositórios sugeridos:"
}) => {
  const colorClasses = {
    blue: {
      dropdown: 'border-blue-200',
      item: 'hover:bg-blue-50'
    },
    emerald: {
      dropdown: 'border-emerald-200',
      item: 'hover:bg-emerald-50'
    }
  }

  if (repositories.length === 0) {
    return null
  }

  return (
    <div className="space-y-1">
      <p className="text-xs text-gray-500">{title}</p>
      <div className={`border rounded-md shadow-sm max-h-40 overflow-auto ${colorClasses[colorScheme].dropdown}`}>
        {repositories.map((repo) => (
          <button
            key={repo.id}
            type="button"
            onClick={() => onSelect(repo.full_name)}
            className={`w-full px-3 py-2 text-left text-sm ${colorClasses[colorScheme].item}`}
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
        ))}
      </div>
    </div>
  )
}

export default RepositorySuggestionList