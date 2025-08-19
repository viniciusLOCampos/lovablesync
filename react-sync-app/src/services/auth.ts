import { Octokit } from '@octokit/rest'
import type { GitHubRepo } from '../types'

class GitHubAuthService {
  private octokit: Octokit | null = null
  private token: string | null = null

  /**
   * Configura o token do GitHub e inicializa o cliente Octokit
   */
  setToken(token: string): void {
    this.token = token
    this.octokit = new Octokit({
      auth: token,
      baseUrl: 'https://api.github.com'
    })
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
  }
}

// Instância singleton do serviço de autenticação
export const githubAuth = new GitHubAuthService()
export default githubAuth