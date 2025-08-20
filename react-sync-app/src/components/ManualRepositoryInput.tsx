import React from 'react'
import { AlertCircle } from 'lucide-react'

interface ManualRepositoryInputProps {
  value: string
  onChange: (value: string) => void
  placeholder: string
  error?: string
  validationStatus?: 'valid' | 'invalid' | 'validating'
  validationIcon?: React.ReactNode
  colorScheme: 'blue' | 'emerald'
}

const ManualRepositoryInput: React.FC<ManualRepositoryInputProps> = ({
  value,
  onChange,
  placeholder,
  error,
  validationStatus,
  validationIcon,
  colorScheme
}) => {
  const colorClasses = {
    blue: 'border-blue-300 focus:border-blue-500 focus:ring-blue-500',
    emerald: 'border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500'
  }

  return (
    <div className="space-y-2">
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 ${
          error 
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
            : colorClasses[colorScheme]
        }`}
      />
      
      {error && (
        <div className="flex items-center space-x-1 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
      
      {validationStatus && (
        <div className={`flex items-center space-x-1 text-sm ${
          validationStatus === 'valid' ? 'text-green-600' :
          validationStatus === 'invalid' ? 'text-red-600' :
          'text-yellow-600'
        }`}>
          {validationIcon}
          <span>
            {validationStatus === 'valid' ? 'Repositório válido' :
             validationStatus === 'invalid' ? 'Repositório inválido' :
             'Validando...'}
          </span>
        </div>
      )}
    </div>
  )
}

export default ManualRepositoryInput