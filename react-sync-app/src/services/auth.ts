import { Octokit } from '@octokit/rest'
import type { GitHubRepo } from '../types'

class GitHubAuthService {
  private octokit: Octokit | null = null
  private token: string | null = null
  private readonly STORAGE_KEY = 'github_token'

  constructor() {
    // Carrega o token do localStorage na inicialização
    this.loadTokenFromStorage()
  }

  /**
   * Configura o token do GitHub e inicializa o cliente Octokit
   */
  setToken(token: string, persist: boolean = true): void {
    this.token = token
    this.octokit = new Octokit({
      auth: token,
      baseUrl: 'https://api.github.com'
    })
    
    // Salva o token no localStorage se solicitado
    if (persist) {
      this.saveTokenToStorage(token)
    }
  }

  /**
   * Salva o token no localStorage
   */
  private saveTokenToStorage(token: string): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, token)
    } catch (error) {
      console.warn('Erro ao salvar token no localStorage:', error)
    }
  }

  /**
   * Carrega o token do localStorage
   */
  private loadTokenFromStorage(): void {
    try {
      const savedToken = localStorage.getItem(this.STORAGE_KEY)
      if (savedToken) {
        this.setToken(savedToken, false) // Não persiste novamente
      }
    } catch (error) {
      console.warn('Erro ao carregar token do localStorage:', error)
    }
  }

  /**
   * Remove o token do localStorage
   */
  private removeTokenFromStorage(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY)
    } catch (error) {
      console.warn('Erro ao remover token do localStorage:', error)
    }
  }

  /**
   * Retorna o token atual
   */
  getToken(): string | null {
    return this.token
  }

  /**
   * Verifica se o usuário está autenticado
   */
  isAuthenticated(): boolean {
    return this.token !== null && this.octokit !== null
  }

  /**
   * Valida o token do GitHub fazendo uma requisição para obter dados do usuário
   */
  async validateToken(token: string): Promise<{ valid: boolean; username?: string; error?: string }> {
    try {
      const tempOctokit = new Octokit({ auth: token })
      const { data: user } = await tempOctokit.rest.users.getAuthenticated()
      
      return {
        valid: true,
        username: user.login
      }
    } catch (error: unknown) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Token inválido'
    }
    }
  }

  /**
   * Obtém informações do usuário autenticado
   */
  async getUserInfo(): Promise<{ username: string; email?: string } | null> {
    if (!this.octokit) {
      throw new Error('Token do GitHub não configurado')
    }

    try {
      const { data: user } = await this.octokit.rest.users.getAuthenticated()
      return {
        username: user.login,
        email: user.email || undefined
      }
    } catch (error: unknown) {
    console.error('Erro ao obter informações do usuário:', error)
    return null
    }
  }

  /**
   * Lista repositórios privados do usuário
   */
  async getPrivateRepositories(): Promise<GitHubRepo[]> {
    if (!this.octokit) {
      throw new Error('Token do GitHub não configurado')
    }

    try {
      const { data: repos } = await this.octokit.rest.repos.listForAuthenticatedUser({
        visibility: 'private',
        sort: 'updated',
        per_page: 100
      })

      return repos.map(repo => ({
        id: repo.id,
        owner: repo.owner.login,
        name: repo.name,
        full_name: repo.full_name,
        private: repo.private
      }))
    } catch (error: unknown) {
    console.error('Erro ao listar repositórios:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    throw new Error(`Erro ao listar repositórios: ${errorMessage}`)
    }
  }

  /**
   * Lista todos os repositórios do usuário (públicos e privados)
   */
  async getUserRepositories(): Promise<GitHubRepo[]> {
    if (!this.octokit) {
      throw new Error('Token do GitHub não configurado')
    }

    try {
      const { data: repos } = await this.octokit.rest.repos.listForAuthenticatedUser({
        sort: 'updated',
        per_page: 100
      })

      return repos.map(repo => ({
        id: repo.id,
        owner: repo.owner.login,
        name: repo.name,
        full_name: repo.full_name,
        private: repo.private
      }))
    } catch (error: unknown) {
    console.error('Erro ao listar repositórios do usuário:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    throw new Error(`Erro ao listar repositórios: ${errorMessage}`)
    }
  }

  /**
   * Verifica se um repositório existe e é acessível
   */
  async validateRepository(owner: string, repo: string): Promise<{ valid: boolean; error?: string }> {
    if (!this.octokit) {
      throw new Error('Token do GitHub não configurado')
    }

    try {
      await this.octokit.rest.repos.get({
        owner,
        repo
      })
      return { valid: true }
    } catch (error: unknown) {
    if (error && typeof error === 'object' && 'status' in error && error.status === 404) {
      return {
        valid: false,
        error: 'Repositório não encontrado ou sem acesso'
      }
    }
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Erro ao validar repositório'
    }
    }
  }

  /**
   * Obtém o cliente Octokit configurado
   */
  getOctokit(): Octokit {
    if (!this.octokit) {
      throw new Error('Token do GitHub não configurado')
    }
    return this.octokit
  }

  /**
   * Remove a autenticação
   */
  logout(): void {
    this.token = null
    this.octokit = null
    this.removeTokenFromStorage()
  }
}

// Instância singleton do serviço de autenticação
export const githubAuth = new GitHubAuthService()
export default githubAuth