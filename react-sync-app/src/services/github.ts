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
   * Obtém o conteúdo de um arquivo (blob) via Git Data API
   * Retorna o conteúdo em Base64
   */
  async getBlobContent(owner: string, repo: string, sha: string): Promise<string> {
    try {
      const { data } = await this.getOctokit().rest.git.getBlob({
        owner,
        repo,
        file_sha: sha
      })
      return data.content // Retorna base64
    } catch (error: unknown) {
      console.error(`Erro ao obter blob ${sha}:`, error)
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      throw new Error(`Erro ao obter conteúdo do blob: ${errorMessage}`)
    }
  }

  /**
   * Obtém o conteúdo de um arquivo específico (LEGACY - usado apenas para compatibilidade se necessário)
   */
  async getFileContent(owner: string, repo: string, path: string): Promise<string> {
    try {
      const { data } = await this.getOctokit().rest.repos.getContent({
        owner,
        repo,
        path
      })

      if ('content' in data && data.content) {
        return atob(data.content)
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
        message: `Exclusão de ${path} via GitHub Sync Tool`,
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
      const encodedContent = btoa(content)

      await this.getOctokit().rest.repos.createOrUpdateFileContents({
        owner,
        repo,
        path,
        message: `${sha ? 'Atualização de' : 'Criação de'} ${path} via GitHub Sync Tool`,
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
   * Obtém a árvore de arquivos completa (recursiva)
   */
  async getTree(owner: string, repo: string, sha: string): Promise<any> {
    const { data } = await this.getOctokit().rest.git.getTree({
      owner,
      repo,
      tree_sha: sha,
      recursive: 'true'
    })
    return data
  }

  /**
   * Cria um Blob (arquivo) no Git
   */
  async createBlob(owner: string, repo: string, content: string): Promise<string> {
    const { data } = await this.getOctokit().rest.git.createBlob({
      owner,
      repo,
      content,
      encoding: 'base64'
    })
    return data.sha
  }

  /**
   * Cria uma nova Árvore (Tree)
   */
  async createTree(owner: string, repo: string, tree: any[], base_tree?: string): Promise<string> {
    const { data } = await this.getOctokit().rest.git.createTree({
      owner,
      repo,
      tree,
      base_tree
    })
    return data.sha
  }

  /**
   * Cria um Commit
   */
  async createCommit(
    owner: string,
    repo: string,
    message: string,
    tree: string,
    parents: string[]
  ): Promise<string> {
    const { data } = await this.getOctokit().rest.git.createCommit({
      owner,
      repo,
      message,
      tree,
      parents
    })
    return data.sha
  }

  /**
   * Cria uma referência (Branch)
   */
  async createRef(owner: string, repo: string, ref: string, sha: string): Promise<void> {
    await this.getOctokit().rest.git.createRef({
      owner,
      repo,
      ref,
      sha
    })
  }

  /**
   * Atualiza a referência (Branch)
   */
  async updateRef(owner: string, repo: string, ref: string, sha: string): Promise<void> {
    await this.getOctokit().rest.git.updateRef({
      owner,
      repo,
      ref,
      sha,
      force: true // Força a atualização para garantir que fique igual à origem
    })
  }

  /**
   * Obtém o SHA do último commit de uma branch
   */
  async getBranchSha(owner: string, repo: string, branch: string = 'main'): Promise<string> {
    try {
      const { data } = await this.getOctokit().rest.repos.getBranch({
        owner,
        repo,
        branch
      })
      return data.commit.sha
    } catch (error) {
      // Tenta 'master' se 'main' falhar
      if (branch === 'main') {
        try {
          return await this.getBranchSha(owner, repo, 'master')
        } catch {
          throw error // Se falhar em master também, lança o erro (repositório vazio)
        }
      }
      throw error
    }
  }

  /**
   * Executa a sincronização ATÔMICA via Git Data API
   */
  async syncRepositories(
    sourceOwner: string,
    sourceRepo: string,
    targetOwner: string,
    targetRepo: string,
    onProgress?: (progress: SyncProgress) => void
  ): Promise<SyncResult> {
    const startTime = Date.now()
    const totalFilesProcessed = 0 // Estável

    try {
      // 1. Inicialização e Obtenção de Refs
      if (onProgress) {
        onProgress({
          configId: '',
          configName: '',
          status: 'in_progress',
          currentStep: 'listing',
          filesProcessed: 0,
          totalFiles: 0,
          progress: 5,
          message: 'Analisando referências dos repositórios...'
        })
      }

      // Obter SHA da HEAD dos dois repositórios
      const sourceBranchSha = await this.getBranchSha(sourceOwner, sourceRepo)
      let targetBranchSha: string | null = null
      let targetBranchName = 'main'
      let isInitialCommit = false

      try {
        targetBranchSha = await this.getBranchSha(targetOwner, targetRepo, 'main')
      } catch {
        try {
          targetBranchName = 'master'
          targetBranchSha = await this.getBranchSha(targetOwner, targetRepo, 'master')
        } catch {
          // Se falhar em ambos, assumimos repositório vazio / branch inexistente
          console.log('Repositório alvo parece vazio ou branch principal não encontrada.')
          isInitialCommit = true
          targetBranchName = 'main' // Vamos criar a main
        }
      }

      // 2. Obter Trees
      let sourceTree: any
      let targetTreeFiles: any[] = []

      // Source Tree
      const sourceTreeData = await this.getTree(sourceOwner, sourceRepo, sourceBranchSha)
      sourceTree = sourceTreeData

      // Target Tree (apenas se não for initial commit)
      if (!isInitialCommit && targetBranchSha) {
        try {
          const targetTreeData = await this.getTree(targetOwner, targetRepo, targetBranchSha)
          targetTreeFiles = targetTreeData.tree.filter((item: any) => item.type === 'blob')
        } catch (e) {
          console.warn('Não foi possível obter a tree do target, assumindo vazio', e)
        }
      }

      // 3. Comparar e Preparar Blobs
      const sourceFiles = sourceTree.tree.filter((item: any) => item.type === 'blob')
      const targetMap = new Map(targetTreeFiles.map((f: any) => [f.path, f.sha]))

      const blobsToCreate: any[] = []
      const finalTreeFiles: any[] = []

      for (const file of sourceFiles) {
        const targetSha = targetMap.get(file.path)

        // Se o arquivo existe e o SHA é igual, usamos o blob existente
        if (targetSha === file.sha) {
          finalTreeFiles.push({
            path: file.path,
            mode: file.mode,
            type: 'blob',
            sha: file.sha
          })
        } else {
          // Novo ou Modificado
          blobsToCreate.push(file)
        }
      }

      // 4. Upload de Blobs (Paralelo)
      const totalBlobs = blobsToCreate.length
      let processedBlobs = 0

      // Processar em lotes
      const BATCH_SIZE = 5

      for (let i = 0; i < blobsToCreate.length; i += BATCH_SIZE) {
        const batch = blobsToCreate.slice(i, i + BATCH_SIZE)

        await Promise.all(batch.map(async (file) => {
          try {
            // LIMITE DE SEGURANÇA: 90MB (GitHub limita a 100MB)
            const MAX_BLOB_SIZE = 90 * 1024 * 1024

            if (file.size && file.size > MAX_BLOB_SIZE) {
              console.log(`Arquivo grande detectado (${file.path}: ${file.size} bytes). Iniciando fragmentação...`)

              // 1. Obter conteúdo completo
              const fullContentBase64 = await this.getBlobContent(sourceOwner, sourceRepo, file.sha)

              // Conversão Base64 -> Binary String -> Uint8Array é custosa mas necessária para split correto
              const binaryString = atob(fullContentBase64)
              const len = binaryString.length
              const bytes = new Uint8Array(len)
              for (let k = 0; k < len; k++) {
                bytes[k] = binaryString.charCodeAt(k)
              }

              // 2. Fragmentar
              const totalParts = Math.ceil(len / MAX_BLOB_SIZE)

              for (let part = 0; part < totalParts; part++) {
                const start = part * MAX_BLOB_SIZE
                const end = Math.min(start + MAX_BLOB_SIZE, len)
                const chunk = bytes.slice(start, end)

                // Converter chunk de volta para Base64
                let binary = ''
                const CHUNK_SIZE = 8192 // Processar em pequenos pedaços para evitar stack overflow
                for (let c = 0; c < chunk.length; c += CHUNK_SIZE) {
                  binary += String.fromCharCode.apply(null, Array.from(chunk.slice(c, c + CHUNK_SIZE)))
                }
                const chunkBase64 = btoa(binary)

                // 3. Criar Blob da Parte
                const newBlobSha = await this.createBlob(targetOwner, targetRepo, chunkBase64)

                // 4. Adicionar à Tree como .partN
                // Formato: nome.ext.part001, nome.ext.part002...
                const partSuffix = String(part + 1).padStart(3, '0')
                const partPath = `${file.path}.part${partSuffix}`

                finalTreeFiles.push({
                  path: partPath,
                  mode: file.mode,
                  type: 'blob',
                  sha: newBlobSha
                })

                if (onProgress) {
                  onProgress({
                    configId: '',
                    configName: '',
                    status: 'in_progress',
                    currentStep: 'copying',
                    filesProcessed: processedBlobs,
                    totalFiles: totalBlobs,
                    progress: 90, // Manter alto
                    message: `Fragmentando: ${file.path} (Parte ${part + 1}/${totalParts})`
                  })
                }
              }
              console.log(`Arquivo ${file.path} fragmentado em ${totalParts} partes com sucesso.`)
              // NÃO adicionamos o arquivo original à tree, apenas as partes.
              processedBlobs++

            } else {
              // FLUXO NORMAL (< 90MB)
              // USANDO getBlobContent para pegar o base64 direto via SHA
              const content = await this.getBlobContent(sourceOwner, sourceRepo, file.sha)
              // createFile espera base64 se encoding for base64. O getBlobContent retorna base64.
              const newBlobSha = await this.createBlob(targetOwner, targetRepo, content)

              finalTreeFiles.push({
                path: file.path,
                mode: file.mode,
                type: 'blob',
                sha: newBlobSha
              })

              processedBlobs++
              if (onProgress) {
                const progress = Math.round((processedBlobs / totalBlobs) * 80) + 10
                onProgress({
                  configId: '',
                  configName: '',
                  status: 'in_progress',
                  currentStep: 'copying',
                  filesProcessed: processedBlobs,
                  totalFiles: totalBlobs,
                  progress,
                  message: `Sincronizando: ${file.path}`
                })
              }
            }

          } catch (e: any) {
            console.error(`Erro processando ${file.path}`, e)
            // Tentar recuperar versão antiga se existir para não deletar
            const oldSha = targetMap.get(file.path)
            if (oldSha) {
              console.warn(`Mantendo versão antiga de ${file.path} devido a erro.`)
              finalTreeFiles.push({
                path: file.path,
                mode: file.mode,
                type: 'blob',
                sha: oldSha
              })
            } else {
              console.warn(`Arquivo ${file.path} ignorado (novo e com erro).`)
            }
            // Não lançar erro para não parar o processo
          }
        }))
      }

      // 5. Criar Tree
      if (onProgress) {
        onProgress({
          configId: '',
          configName: '',
          status: 'in_progress',
          currentStep: 'copying',
          filesProcessed: totalBlobs,
          totalFiles: totalBlobs,
          progress: 90,
          message: 'Finalizando estrutura de arquivos (Tree)...'
        })
      }

      const newTreeSha = await this.createTree(targetOwner, targetRepo, finalTreeFiles)

      // 6. Criar Commit
      if (onProgress) {
        onProgress({
          configId: '',
          configName: '',
          status: 'in_progress',
          currentStep: 'copying',
          filesProcessed: totalBlobs,
          totalFiles: totalBlobs,
          progress: 95,
          message: 'Criando commit...'
        })
      }

      const commitMessage = `Sincronização: ${new Date().toISOString()}`

      // Se for commit inicial, pais é array vazio. Senão, array com o SHA anterior.
      const parents = isInitialCommit ? [] : [targetBranchSha!]

      const newCommitSha = await this.createCommit(targetOwner, targetRepo, commitMessage, newTreeSha, parents)

      // 7. Atualizar Ref (ou criar se não existir)
      if (isInitialCommit) {
        await this.createRef(targetOwner, targetRepo, `refs/heads/${targetBranchName}`, newCommitSha)
      } else {
        await this.updateRef(targetOwner, targetRepo, `heads/${targetBranchName}`, newCommitSha)
      }

      const duration = Date.now() - startTime

      if (onProgress) {
        onProgress({
          configId: '',
          configName: '',
          status: 'success',
          currentStep: 'completed',
          filesProcessed: totalBlobs,
          totalFiles: totalBlobs,
          progress: 100,
          message: `Sincronização Atômica concluída! ${totalBlobs} arquivos atualizados.`
        })
      }

      return {
        success: true,
        filesProcessed: totalBlobs,
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
          progress: 0,
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
