/**
 * EvaluationModel - Modelo de dados para avaliações de acessibilidade
 * 
 * Responsabilidades:
 * - Gerenciar dados de avaliações de sites
 * - Integração com API Lighthouse para avaliação real
 * - Definir critérios WCAG
 * - Calcular pontuações e sugestões de planos
 * - Regras de negócio para avaliações
 */

import ApiService from '../../services/ApiService';

export interface EvaluationIssue {
  id: string;
  text: string;
  priority?: number;
  type?: 'issue' | 'wcag';
}

export interface EvaluationResult {
  score: number;
  issues: EvaluationIssue[];
  siteUrl: string;
  evaluatedAt: Date;
}

export interface WCAGItem {
  id: string;
  text: string;
  level: 'A' | 'AA' | 'AAA';
}

export interface AccessibilityPlan {
  level: 'A' | 'AA' | 'AAA';
  description: string;
  wcagItems: WCAGItem[];
}

export class EvaluationModel {
  private static api = ApiService;
  private static USE_API = true; // Flag para controlar uso da API
  
  // Critérios WCAG por nível
  private static readonly WCAG_ITEMS: Record<string, WCAGItem[]> = {
    A: [
      { id: 'wcag-a-1', text: 'Navegação total via teclado', level: 'A' },
      { id: 'wcag-a-2', text: 'Legendas em vídeos pré-gravados', level: 'A' },
      { id: 'wcag-a-3', text: 'Controles de áudio visíveis', level: 'A' },
      { id: 'wcag-a-4', text: 'Não usar apenas cor para transmitir informação', level: 'A' },
    ],
    AA: [
      { id: 'wcag-aa-1', text: 'Contraste de cor mínimo (4.5:1)', level: 'AA' },
      { id: 'wcag-aa-2', text: 'Audiodescrição em vídeos pré-gravados', level: 'AA' },
      { id: 'wcag-aa-3', text: 'Texto redimensionável até 200%', level: 'AA' },
      { id: 'wcag-aa-4', text: 'Múltiplas formas de encontrar páginas', level: 'AA' },
    ],
    AAA: [
      { id: 'wcag-aaa-1', text: 'Contraste de cor aprimorado (7:1)', level: 'AAA' },
      { id: 'wcag-aaa-2', text: 'Interpretação em LIBRAS para vídeos', level: 'AAA' },
      { id: 'wcag-aaa-3', text: 'Justificativa para links fora de contexto', level: 'AAA' },
      { id: 'wcag-aaa-4', text: 'Sem limite de tempo para interações', level: 'AAA' },
    ]
  };

  // Problemas comuns encontrados em avaliações
  private static readonly COMMON_ISSUES: EvaluationIssue[] = [
    { id: 'issue-1', text: 'Contraste de texto baixo', type: 'issue' },
    { id: 'issue-2', text: 'Imagens sem texto alternativo', type: 'issue' },
    { id: 'issue-3', text: 'Links sem descrição clara', type: 'issue' },
    { id: 'issue-4', text: 'Campos de formulário sem rótulo', type: 'issue' },
    { id: 'issue-5', text: 'Falta de navegação por teclado', type: 'issue' },
    { id: 'issue-6', text: 'Vídeos sem legendas', type: 'issue' },
    { id: 'issue-7', text: 'Conteúdo que pisca ou pisca muito rápido', type: 'issue' },
    { id: 'issue-8', text: 'Estrutura de cabeçalhos inadequada', type: 'issue' },
  ];

  /**
   * Avalia acessibilidade de um site usando Lighthouse API
   * @param siteUrl - URL do site a ser avaliado
   * @returns Promise com resultado da avaliação
   */
  static async evaluateSite(siteUrl: string): Promise<EvaluationResult> {
    try {
      // Tentar usar a API primeiro
      if (this.USE_API) {
        try {
          const apiResponse = await this.api.analyzeSiteAccessibility(siteUrl);

          if (apiResponse.success && apiResponse.data) {
            const lighthouseData = apiResponse.data;
            
            // Verificar se recebemos dados no formato do backend (notaAcessibilidade)
            if (lighthouseData.notaAcessibilidade !== undefined) {
              const score = Math.round(lighthouseData.notaAcessibilidade);
              
              // Extrair problemas das auditorias reprovadas
              const issues: EvaluationIssue[] = [];
              
              // Processar auditorias reprovadas (score = 0)
              if (lighthouseData.reprovadas && Array.isArray(lighthouseData.reprovadas)) {
                lighthouseData.reprovadas.forEach((audit: any) => {
                  if (audit.title) {
                    issues.push({
                      id: audit.id || `reprovada-${issues.length}`,
                      text: audit.title,
                      type: 'issue',
                      priority: 5 // Máxima prioridade para reprovadas
                    });
                  }
                });
              }
              
              // Processar auditorias manuais (necessitam verificação manual)
              if (lighthouseData.manuais && Array.isArray(lighthouseData.manuais)) {
                lighthouseData.manuais.slice(0, 3).forEach((audit: any) => {
                  if (audit.title) {
                    issues.push({
                      id: audit.id || `manual-${issues.length}`,
                      text: `[Verificação Manual] ${audit.title}`,
                      type: 'issue',
                      priority: 3 // Prioridade média para manuais
                    });
                  }
                });
              }

              // Limitar a 10 issues mais críticos
              const topIssues = issues
                .sort((a, b) => (b.priority || 0) - (a.priority || 0))
                .slice(0, 10);

              // Log resumido apenas (sem dados completos)
              console.log(`[EvaluationModel] ✅ Avaliação concluída: ${score}% de acessibilidade`);
              
              return {
                score,
                issues: topIssues.length > 0 ? topIssues : this.getRandomIssues(),
                siteUrl,
                evaluatedAt: new Date()
              };
            }
            
            // Formato antigo/alternativo da API (mantido para retrocompatibilidade)
            if (lighthouseData.accessibility !== undefined) {
              const score = Math.round((lighthouseData.accessibility || 0) * 100);
              
              const issues: EvaluationIssue[] = [];
              const audits = lighthouseData.audits || {};
              
              Object.entries(audits).forEach(([key, audit]: [string, any]) => {
                if (audit.score !== null && audit.score < 1 && audit.title) {
                  issues.push({
                    id: key,
                    text: audit.title,
                    type: 'issue',
                    priority: audit.score === 0 ? 5 : Math.ceil((1 - audit.score) * 5)
                  });
                }
              });

              const topIssues = issues
                .sort((a, b) => (b.priority || 0) - (a.priority || 0))
                .slice(0, 10);

              console.log(`[EvaluationModel] Avaliação concluída: ${score}% de acessibilidade`);
              
              return {
                score,
                issues: topIssues.length > 0 ? topIssues : this.getRandomIssues(),
                siteUrl,
                evaluatedAt: new Date()
              };
            }
          }
          
          // Se chegou aqui, temos um erro da API
          if (!apiResponse.success) {
            const errorMsg = apiResponse.error || 'Erro desconhecido';
            console.error('[EvaluationModel] ❌ Erro da API:', errorMsg);
            console.error('[EvaluationModel] Status Code:', apiResponse.statusCode);
            
            // Transformar mensagem técnica em mensagem amigável ao usuário
            const friendlyMessage = this.getFriendlyErrorMessage(errorMsg);
            throw new Error(friendlyMessage);
          }
          
          console.warn('[EvaluationModel] ⚠️ Resposta da API em formato não reconhecido');
          throw new Error('Resposta da API em formato não reconhecido');
        } catch (apiError) {
          console.error('[EvaluationModel] ❌ Erro ao avaliar site:', apiError);
          
          // Transformar mensagem técnica em mensagem amigável
          const errorMessage = apiError instanceof Error ? apiError.message : String(apiError);
          const friendlyMessage = this.getFriendlyErrorMessage(errorMessage);
          
          // Re-lançar o erro com mensagem amigável
          throw new Error(friendlyMessage);
        }
      }

      // Fallback: Simular avaliação (somente se USE_API for false)
      console.log('[EvaluationModel] ⚠️ Modo API desativado, usando simulação...');
      return this.simulateEvaluation(siteUrl);
    } catch (error) {
      console.error('[EvaluationModel] ❌ Erro fatal ao avaliar site:', error);
      // Re-lançar o erro para ser tratado pelo controlador
      throw error;
    }
  }

  /**
   * Simula avaliação de um site (fallback)
   * @param siteUrl - URL do site a ser avaliado
   * @returns Resultado da avaliação simulada
   */
  private static async simulateEvaluation(siteUrl: string): Promise<EvaluationResult> {
    console.log('[EvaluationModel] Usando avaliação simulada...');
    
    // Simula delay de rede
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Gera score aleatório entre 30-95
    const score = Math.floor(Math.random() * (95 - 30 + 1)) + 30;
    
    // Seleciona problemas aleatórios
    const selectedIssues = this.getRandomIssues();

    return {
      score,
      issues: selectedIssues,
      siteUrl,
      evaluatedAt: new Date()
    };
  }

  /**
   * Obtém problemas aleatórios para simulação
   */
  private static getRandomIssues(): EvaluationIssue[] {
    const numIssues = Math.floor(Math.random() * 4) + 1; // 1-4 problemas
    const shuffledIssues = [...this.COMMON_ISSUES].sort(() => 0.5 - Math.random());
    return shuffledIssues.slice(0, numIssues);
  }

  /**
   * Obtém critérios WCAG por nível
   * @param level - Nível WCAG ('A', 'AA', 'AAA')
   * @returns Lista de critérios WCAG
   */
  static getWCAGItems(level: 'A' | 'AA' | 'AAA'): WCAGItem[] {
    if (level === 'A') {
      return [...this.WCAG_ITEMS.A];
    } else if (level === 'AA') {
      return [...this.WCAG_ITEMS.A, ...this.WCAG_ITEMS.AA];
    } else if (level === 'AAA') {
      return [...this.WCAG_ITEMS.A, ...this.WCAG_ITEMS.AA, ...this.WCAG_ITEMS.AAA];
    }
    return [];
  }

  /**
   * Obtém todos os critérios WCAG
   */
  static getAllWCAGItems(): Record<string, WCAGItem[]> {
    return { ...this.WCAG_ITEMS };
  }

  /**
   * Sugere planos baseado na pontuação da avaliação
   * @param score - Pontuação da avaliação (0-100)
   * @returns Lista de planos sugeridos
   */
  static suggestPlans(score: number): AccessibilityPlan[] {
    const suggestions: AccessibilityPlan[] = [];

    if (score < 70) {
      // Site com muitos problemas - sugere todos os planos
      suggestions.push(
        { level: 'A', description: 'Correções básicas de acessibilidade', wcagItems: this.getWCAGItems('A') },
        { level: 'AA', description: 'Correções intermediárias de acessibilidade', wcagItems: this.getWCAGItems('AA') },
        { level: 'AAA', description: 'Correções avançadas de acessibilidade', wcagItems: this.getWCAGItems('AAA') }
      );
    } else if (score >= 70 && score < 90) {
      // Site com problemas moderados - sugere planos AA e AAA
      suggestions.push(
        { level: 'AA', description: 'Correções intermediárias de acessibilidade', wcagItems: this.getWCAGItems('AA') },
        { level: 'AAA', description: 'Correções avançadas de acessibilidade', wcagItems: this.getWCAGItems('AAA') }
      );
    } else {
      // Site com poucos problemas - sugere apenas AAA
      suggestions.push(
        { level: 'AAA', description: 'Correções avançadas de acessibilidade', wcagItems: this.getWCAGItems('AAA') }
      );
    }

    return suggestions;
  }

  /**
   * Cria checklist combinado de problemas e critérios WCAG
   * @param issues - Problemas encontrados na avaliação
   * @param planLevel - Nível do plano selecionado
   * @returns Checklist combinado
   */
  static createChecklist(issues: EvaluationIssue[], planLevel: 'A' | 'AA' | 'AAA'): Record<string, EvaluationIssue> {
    const wcagItems = this.getWCAGItems(planLevel);
    const combined = [
      ...issues.map(issue => ({ ...issue, type: 'issue' as const })),
      ...wcagItems.map(wcag => ({ ...wcag, type: 'wcag' as const }))
    ];

    const checklist: Record<string, EvaluationIssue> = {};
    combined.forEach(item => {
      const key = item.id || item.text;
      checklist[key] = { ...item, priority: 0 };
    });

    return checklist;
  }

  /**
   * Calcula prioridade média dos itens selecionados
   * @param selectedIssues - Itens selecionados com prioridades
   * @returns Prioridade média
   */
  static calculateAveragePriority(selectedIssues: EvaluationIssue[]): number {
    if (selectedIssues.length === 0) return 0;
    
    const totalPriority = selectedIssues.reduce((sum, issue) => sum + (issue.priority || 0), 0);
    return Math.round(totalPriority / selectedIssues.length);
  }

  /**
   * Valida URL do site
   * @param url - URL a ser validada
   * @returns true se URL é válida
   */
  static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Formata URL para exibição
   * @param url - URL a ser formatada
   * @returns URL formatada
   */
  static formatUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return url;
    }
  }

  /**
   * Obtém descrição do nível de acessibilidade
   * @param level - Nível WCAG
   * @returns Descrição do nível
   */
  static getLevelDescription(level: 'A' | 'AA' | 'AAA'): string {
    const descriptions = {
      'A': 'Nível mínimo de acessibilidade - requisitos básicos',
      'AA': 'Nível padrão de acessibilidade - requisitos intermediários',
      'AAA': 'Nível avançado de acessibilidade - requisitos máximos'
    };
    return descriptions[level];
  }

  /**
   * Transforma mensagens técnicas de erro em mensagens amigáveis ao usuário
   * Remove referências técnicas como "Lighthouse" e torna a mensagem mais clara
   */
  private static getFriendlyErrorMessage(errorMessage: string): string {
    const lowerError = errorMessage.toLowerCase();
    
    // Erros de URL inacessível
    if (lowerError.includes('não pôde ser acessada') || 
        lowerError.includes('não foi possível conectar') ||
        lowerError.includes('enotfound') ||
        lowerError.includes('econnrefused') ||
        lowerError.includes('timeout') ||
        lowerError.includes('err_name_not_resolved') ||
        lowerError.includes('err_connection')) {
      // Extrair URL da mensagem se possível
      const urlMatch = errorMessage.match(/URL\s+"([^"]+)"/);
      if (urlMatch) {
        return `Não foi possível acessar o site "${urlMatch[1]}". Verifique se o endereço está correto e se o site está online.`;
      }
      return 'Não foi possível acessar o site. Verifique se o endereço está correto e se o site está online.';
    }
    
    // Remover referências técnicas (mas NÃO substituir em URLs/paths)
    // Primeiro, proteger URLs/paths temporariamente
    const urlPattern = /(https?:\/\/[^\s]+|\/[^\s]*)/g;
    const urls: string[] = [];
    let protectedMsg = errorMessage.replace(urlPattern, (match) => {
      urls.push(match);
      return `__URL_${urls.length - 1}__`;
    });
    
    // Agora fazer as substituições apenas no texto (não nas URLs)
    let friendlyMsg = protectedMsg
      .replace(/erro ao executar o lighthouse:/gi, '')
      .replace(/lighthouse/gi, 'análise')
      .replace(/não foi possível analisar o site/gi, 'Não foi possível analisar o site')
      .trim();
    
    // Restaurar URLs originais
    urls.forEach((url, index) => {
      friendlyMsg = friendlyMsg.replace(`__URL_${index}__`, url);
    });
    
    // Se a mensagem ficou vazia ou muito técnica, usar mensagem genérica
    if (!friendlyMsg || friendlyMsg.length < 10) {
      return 'Não foi possível analisar o site. Verifique se a URL está correta e tente novamente.';
    }
    
    // Capitalizar primeira letra
    return friendlyMsg.charAt(0).toUpperCase() + friendlyMsg.slice(1);
  }

  /**
   * Define se deve usar API ou avaliação simulada
   */
  static setUseApi(useApi: boolean): void {
    this.USE_API = useApi;
    console.log(`[EvaluationModel] Modo de operação: ${useApi ? 'API Lighthouse' : 'Avaliação simulada'}`);
  }

  /**
   * Verifica se está usando API
   */
  static isUsingApi(): boolean {
    return this.USE_API;
  }
}

// EXPANSÃO FUTURA:
// - Integração com ferramentas reais de avaliação (axe-core, WAVE, etc.)
// - Análise de contraste de cores
// - Detecção automática de problemas
// - Relatórios detalhados em PDF
// - Comparação com benchmarks
// - Histórico de avaliações
// - Integração com APIs de acessibilidade


