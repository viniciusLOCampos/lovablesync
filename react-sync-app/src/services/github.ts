import { Octokit } from '@octokit/rest'
import type { GitHubFile, SyncResult, SyncProgress } from '../types'
import { githubAuth } from './auth'

class GitHubSyncService {
  private getOctokit(): Octokit {
    return githubAuth.getOctokit()
  }

  /**
   * Obtém todos os arquivos de um repositório
   */
  async getRepositoryFiles(owner: string, repo: string, path: string = ''): Promise<GitHubFile[]> {
    try {
      const { data } = await this.getOctokit().rest.repos.getContent({
        owner,
        repo,
        path
      })

      if (Array.isArray(data)) {
        const files: GitHubFile[] = []
        
        for (const item of data) {
          if (item.type === 'file') {
            files.push({
              name: item.name,
              path: item.path,
              type: 'file',
              size: item.size,
              sha: item.sha
            })
          } else if (item.type === 'dir') {
            // Recursivamente obter arquivos de subdiretórios
            const subFiles = await this.getRepositoryFiles(owner, repo, item.path)
            files.push(...subFiles)
          }
        }
        
        return files
      } else {
        // Caso seja um arquivo único
        return [{
          name: data.name,
          path: data.path,
          type: 'file',
          size: data.size,
          sha: data.sha
        }]
      }
    } catch (error: unknown) {
      console.error(`Erro ao obter arquivos do repositório ${owner}/${repo}:`, error)
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      throw new Error(`Erro ao obter arquivos: ${errorMessage}`)
    }
  }

  /**
   * Obtém o conteúdo de um arquivo específico
   */
  async getFileContent(owner: string, repo: string, path: string): Promise<string> {
    try {
      const { data } = await this.getOctokit().rest.repos.getContent({
        owner,
        repo,
        path
      })

      if ('content' in data && data.content) {
        return Buffer.from(data.content, 'base64').toString('utf-8')
      }
      
      throw new Error('Arquivo não encontrado ou sem conteúdo')
    } catch (error: unknown) {
      console.error(`Erro ao obter conteúdo do arquivo ${path}:`, error)
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      throw new Error(`Erro ao obter conteúdo: ${errorMessage}`)
    }
  }

  /**
   * Deleta um arquivo do repositório
   */
  async deleteFile(owner: string, repo: string, path: string, sha: string): Promise<void> {
    try {
      await this.getOctokit().rest.repos.deleteFile({
        owner,
        repo,
        path,
        message: `Delete ${path} via GitHub Sync Tool`,
        sha
      })
    } catch (error: unknown) {
      console.error(`Erro ao deletar arquivo ${path}:`, error)
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      throw new Error(`Erro ao deletar arquivo: ${errorMessage}`)
    }
  }

  /**
   * Cria ou atualiza um arquivo no repositório
   */
  async createOrUpdateFile(
    owner: string, 
    repo: string, 
    path: string, 
    content: string, 
    sha?: string
  ): Promise<void> {
    try {
      const encodedContent = Buffer.from(content, 'utf-8').toString('base64')
      
      await this.getOctokit().rest.repos.createOrUpdateFileContents({
        owner,
        repo,
        path,
        message: `${sha ? 'Update' : 'Create'} ${path} via GitHub Sync Tool`,
        content: encodedContent,
        sha
      })
    } catch (error: unknown) {
      console.error(`Erro ao criar/atualizar arquivo ${path}:`, error)
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      throw new Error(`Erro ao criar/atualizar arquivo: ${errorMessage}`)
    }
  }

  /**
   * Deleta todos os arquivos de um repositório (exceto README.md se existir)
   */
  async deleteAllFiles(
    owner: string, 
    repo: string, 
    onProgress?: (progress: number, message: string) => void
  ): Promise<number> {
    try {
      const files = await this.getRepositoryFiles(owner, repo)
      const filesToDelete = files // Deletar TODOS os arquivos
      
      let deletedCount = 0
      
      for (let i = 0; i < filesToDelete.length; i++) {
        const file = filesToDelete[i]
        
        if (onProgress) {
          const progress = Math.round(((i + 1) / filesToDelete.length) * 100)
          onProgress(progress, `Deletando ${file.path}`)
        }
        
        if (file.sha) {
          await this.deleteFile(owner, repo, file.path, file.sha)
          deletedCount++
        }
        
        // Pequeno delay para evitar rate limiting
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
      return deletedCount
    } catch (error: unknown) {
      console.error(`Erro ao deletar arquivos do repositório ${owner}/${repo}:`, error)
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      throw new Error(`Erro ao deletar arquivos: ${errorMessage}`)
    }
  }

  /**
   * Copia todos os arquivos de um repositório para outro
   */
  async copyAllFiles(
    sourceOwner: string,
    sourceRepo: string,
    targetOwner: string,
    targetRepo: string,
    onProgress?: (progress: number, message: string) => void
  ): Promise<number> {
    try {
      const sourceFiles = await this.getRepositoryFiles(sourceOwner, sourceRepo)
      let copiedCount = 0
      
      for (let i = 0; i < sourceFiles.length; i++) {
        const file = sourceFiles[i]
        
        if (onProgress) {
          const progress = Math.round(((i + 1) / sourceFiles.length) * 100)
          onProgress(progress, `Copiando ${file.path}`)
        }
        
        try {
          const content = await this.getFileContent(sourceOwner, sourceRepo, file.path)
          await this.createOrUpdateFile(targetOwner, targetRepo, file.path, content)
          copiedCount++
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
          console.warn(`Erro ao copiar arquivo ${file.path}:`, errorMessage)
          // Continua com os próximos arquivos mesmo se um falhar
        }
        
        // Pequeno delay para evitar rate limiting
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
      return copiedCount
    } catch (error: unknown) {
      console.error(`Erro ao copiar arquivos de ${sourceOwner}/${sourceRepo} para ${targetOwner}/${targetRepo}:`, error)
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      throw new Error(`Erro ao copiar arquivos: ${errorMessage}`)
    }
  }

  /**
   * Executa a sincronização completa (delete + copy)
   */
  async syncRepositories(
    sourceOwner: string,
    sourceRepo: string,
    targetOwner: string,
    targetRepo: string,
    onProgress?: (progress: SyncProgress) => void
  ): Promise<SyncResult> {
    const startTime = Date.now()
    let totalFilesProcessed = 0
    
    try {
      // Fase 1: Deletar arquivos do repositório de destino
      if (onProgress) {
        onProgress({
          configId: '',
          configName: '',
          status: 'in_progress',
          currentStep: 'deleting',
          filesProcessed: 0,
          totalFiles: 0,
          message: 'Deletando arquivos do repositório de destino...'
        })
      }
      
      const deletedFiles = await this.deleteAllFiles(
        targetOwner, 
        targetRepo,
        (_progress, message) => {
          if (onProgress) {
            onProgress({
              configId: '',
              configName: '',
              status: 'in_progress',
              currentStep: 'deleting',
              filesProcessed: 0,
              totalFiles: 0,
              message
            })
          }
        }
      )
      
      // Fase 2: Copiar arquivos do repositório de origem
      if (onProgress) {
        onProgress({
          configId: '',
          configName: '',
          status: 'in_progress',
          currentStep: 'copying',
          filesProcessed: 0,
          totalFiles: 0,
          message: 'Copiando arquivos do repositório de origem...'
        })
      }
      
      const copiedFiles = await this.copyAllFiles(
        sourceOwner,
        sourceRepo,
        targetOwner,
        targetRepo,
        (_progress, message) => {
          if (onProgress) {
            onProgress({
              configId: '',
              configName: '',
              status: 'in_progress',
              currentStep: 'copying',
              filesProcessed: 0,
              totalFiles: 0,
              message
            })
          }
        }
      )
      
      totalFilesProcessed = deletedFiles + copiedFiles
      const duration = Date.now() - startTime
      
      if (onProgress) {
        onProgress({
          configId: '',
          configName: '',
          status: 'success',
          currentStep: 'completed',
          filesProcessed: totalFilesProcessed,
          totalFiles: totalFilesProcessed,
          message: `Sincronização concluída! ${copiedFiles} arquivos copiados.`
        })
      }
      
      return {
        success: true,
        filesProcessed: totalFilesProcessed,
        duration
      }
    } catch (error: unknown) {
      const duration = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      
      if (onProgress) {
        onProgress({
          configId: '',
          configName: '',
          status: 'error',
          currentStep: 'error',
          filesProcessed: totalFilesProcessed,
          totalFiles: 0,
          message: `Erro na sincronização: ${errorMessage}`
        })
      }
      
      return {
        success: false,
        filesProcessed: totalFilesProcessed,
        error: errorMessage,
        duration
      }
    }
  }
}

export const githubSync = new GitHubSyncService()