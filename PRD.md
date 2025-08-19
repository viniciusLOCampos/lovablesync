# PRD – GitHub Repository Sync Tool (One-Click)

## 1. Visão Geral
O **GitHub Repository Sync Tool** é uma aplicação web que replica, com um único clique, o comportamento de fluxos *n8n* para sincronizar múltiplos repositórios GitHub privados. O produto foca em simplicidade operacional e transparência das ações executadas.

## 2. Objetivos do Produto
1. Permitir **sincronização total** (delete + copy) de repositórios configurados em um único comando.
2. Fornecer **interface gráfica minimalista** para gerenciamento das configurações e execução do processo.
3. Exibir **monitoramento em tempo real** do progresso e dos logs de cada sincronização.

### 2.1 Métricas de Sucesso (KPIs)
| Métrica | Alvo |
|---------|------|
| Tempo médio para sincronizar 10 repositórios | ≤ 2 min |
| Erros de sincronização por execução | 0 críticos |
| Adoção interna (usuários ativos) | ≥ 80 % dos devs |

## 3. Requisitos Funcionais
| ID | Descrição | Prioridade |
|----|-----------|------------|
| RF-01 | Botão **SYNC ALL** executa delete & copy completos para todos os repositórios habilitados | Alta |
| RF-02 | Adicionar, editar, remover e habilitar/desabilitar pares *origem → destino* | Alta |
| RF-03 | Validação de existência e permissões de cada repositório antes da sincronização | Alta |
| RF-04 | Barra de progresso global e por repositório | Média |
| RF-05 | Log detalhado de cada operação (delete, copy) | Média |
| RF-06 | Opção de cancelar ou pausar sincronização em andamento | Baixa |

## 4. Requisitos Não Funcionais
| Tipo | Descrição |
|------|-----------|
| Performance | Sincronizar 500 MB de arquivos em ≤ 5 min (rede 100 Mb/s) |
| Confiabilidade | Registro de logs em disco para auditoria │
| Usabilidade | Interface em português, foco em acessibilidade (atalhos de teclado) │
| Segurança | Armazenar token GitHub de forma segura no Supabase │
| Compatibilidade | Navegadores modernos (Chrome, Firefox, Safari, Edge) │

## 5. Jornada do Usuário
1. Usuário abre a aplicação → tela principal lista as configurações.
2. Clica **[+ Adicionar]** para registrar novo par *origem → destino*.
3. Após configurar todos os pares, pressiona **🚀 Sincronizar Todos**.
4. Confirma diálogo resumindo ações (quantidade de repositórios e impacto).
5. Acompanha tela de progresso, podendo **cancelar** ou **pausar** projetos.
6. Ao término, revisa logs ou exporta relatório *.txt*.

## 6. Interface (Wireframes Simplificados)
### 6.1 Tela Principal
```
┌───────────────────────────────┐
│ ☑ user/repo-v1 → user/repo-v2 │
│ ☐ user/legacy  → user/modern  │
│ ...                           │
│ [+] [✏️] [🗑️] [⚙️]             │
│                               │
│          🚀 SINCRONIZAR        │
└───────────────────────────────┘
```
### 6.2 Tela de Progresso
```
Progresso Geral: ████░ 60 %
Projeto A: ✅ DELETE, 🔄 COPY (34/67)
... (logs ao vivo)
```

## 7. Arquitetura Técnica
| Camada | Tecnologia |
|--------|------------|
| Frontend | React + Vite |
| Backend | Supabase (PostgreSQL + Auth + API) |
| GitHub API | Octokit/rest.js ou fetch nativo |
| Autenticação | Token GitHub (apenas github.com) |
| Persistência | Supabase Database |

### 7.1 Estrutura de Pastas
```
github_sync_webapp/
├── src/
│   ├── components/       # Componentes React
│   ├── services/         # GitHub API & Supabase
│   ├── pages/           # Páginas principais
│   └── utils/           # Helpers e utilitários
├── supabase/
│   ├── migrations/      # Schema do banco
│   └── functions/       # Edge functions (se necessário)
└── package.json
```

### 7.2 Fluxo Principal em Pseudocódigo
```javascript
async function syncAll() {
    for (const cfg of enabledConfigs) {
        try {
            await deleteAllFiles(cfg.target);
            await copyAllFiles(cfg.source, cfg.target);
            await logToSupabase(cfg.id, 'success');
        } catch (error) {
            await logToSupabase(cfg.id, 'error', error.message);
            displayError(error.message); // Apenas exibir erro na página
        }
    }
}
```

## 8. Cronograma (MVP)
| Semana | Entrega |
|--------|---------|
| 1 | Setup React + Supabase, autenticação GitHub |
| 2 | Implementar sync logic (delete & copy) para repos privados |
| 3 | Interface funcional + logs (3 dias retenção) |
| 4 | Testes, deploy e validação final |

## 9. Especificações Técnicas Definidas
| Aspecto | Especificação |
|---------|---------------|
| Autenticação | Token GitHub apenas para github.com |
| Repositórios | Suporte exclusivo para repositórios privados |
| Tratamento de Erros | Exibir descrição do erro na página (sem recovery) |
| Banco de Dados | Supabase (não salvar commits, apenas configs e logs) |
| Interface | Funcional e simples (sem foco no visual) |
| Logs | Retenção de 3 dias em formato texto |
| Tipo de App | Webapp (sem assinatura digital) |
| Configurações | Sem importação de configurações existentes |

## 10. Critérios de Aceite
- [ ] Usuário configura pares e executa **SYNC ALL** sem erros críticos.
- [ ] Logs mostram todas as etapas executadas com status (sucesso/falha).
- [ ] Operação pode ser cancelada/pause sem travar a UI.
- [ ] PRD aprovado pelos stakeholders e documentação incluída no repo.