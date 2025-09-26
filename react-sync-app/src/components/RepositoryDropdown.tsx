import React from 'react'
import type { GitHubRepo } from '../types'
import ManualRepositoryInput from './ManualRepositoryInput'
import RepositorySuggestionList from './RepositorySuggestionList'
import BasicRepositoryDropdown from './BasicRepositoryDropdown'

interface RepositoryDropdownProps {
  label: string
  value: string | null
  repositories: GitHubRepo[]
  loading: boolean
  isOpen?: boolean
  onToggle?: () => void
  onSelect: (repoFullName: string) => void
  colorScheme: 'blue' | 'emerald'
  placeholder: string
  variant?: 'default' | 'card'
  showLabel?: boolean
  error?: string
  validationStatus?: 'valid' | 'invalid' | 'validating'
  validationIcon?: React.ReactNode
  allowManualInput?: boolean
  onManualInputChange?: (value: string) => void
}

const RepositoryDropdown: React.FC<RepositoryDropdownProps> = ({
  label,
  value,
  repositories,
  loading,
  isOpen = false,
  onToggle,
  onSelect,
  colorScheme,
  placeholder,
  variant = 'default',
  showLabel = true,
  error,
  validationStatus,
  validationIcon,
  allowManualInput = false,
  onManualInputChange
}) => {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const [showDropdown, setShowDropdown] = React.useState(false)
  
  const isDropdownOpen = isOpen !== undefined ? isOpen : internalOpen
  const handleToggle = onToggle || (() => setInternalOpen(!internalOpen))
  
  React.useEffect(() => {
    if (allowManualInput && repositories.length > 0) {
      setShowDropdown(true)
    } else {
      setShowDropdown(false)
    }
  }, [allowManualInput, repositories])

  // A variante 'card' foi removida pois não é mais necessária com os novos componentes
  if (variant === 'card') {
    // Fallback para a variante default
    variant = 'default'
  }

  // Default variant
  return (
    <div className="space-y-2">
      {showLabel && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      
      {allowManualInput ? (
        <div className="space-y-2">
          <ManualRepositoryInput
            value={value || ''}
            onChange={(newValue) => onManualInputChange?.(newValue)}
            placeholder={placeholder}
            error={error}
            validationStatus={validationStatus}
            validationIcon={validationIcon}
            colorScheme={colorScheme}
          />
          
          {showDropdown && repositories.length > 0 && (
            <RepositorySuggestionList
              repositories={repositories}
              onSelect={(repoFullName) => {
                onSelect(repoFullName)
                onManualInputChange?.(repoFullName)
              }}
              colorScheme={colorScheme}
            />
          )}
        </div>
      ) : (
        <BasicRepositoryDropdown
          value={value}
          repositories={repositories}
          loading={loading}
          isOpen={isDropdownOpen}
          onToggle={handleToggle}
          onSelect={(repoFullName) => {
            onSelect(repoFullName)
            setInternalOpen(false)
          }}
          colorScheme={colorScheme}
          placeholder={placeholder}
        />
      )}
    </div>
  )
}

export default RepositoryDropdown
