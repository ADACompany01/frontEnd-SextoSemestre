/**
 * EvaluationController - Controlador de avaliações
 * 
 * Responsabilidades:
 * - Gerenciar fluxo de avaliação de sites
 * - Controlar seleção de planos
 * - Integrar com EvaluationModel
 * - Gerenciar checklist de itens
 */

import { EvaluationModel, type EvaluationResult, type EvaluationIssue, type AccessibilityPlan, type WCAGItem } from '../../models';

export interface EvaluationState {
  currentEvaluation: EvaluationResult | null;
  selectedPlan: 'A' | 'AA' | 'AAA' | null;
  suggestedPlans: AccessibilityPlan[];
  checklist: Record<string, EvaluationIssue>;
  isLoading: boolean;
  error: string | null;
  evaluationHistory: EvaluationResult[];
}

export type EvaluationAction = 
  | { type: 'EVALUATION_START' }
  | { type: 'EVALUATION_SUCCESS'; result: EvaluationResult }
  | { type: 'EVALUATION_ERROR'; error: string }
  | { type: 'SELECT_PLAN'; plan: 'A' | 'AA' | 'AAA' }
  | { type: 'CLEAR_PLAN' }
  | { type: 'UPDATE_CHECKLIST'; checklist: Record<string, EvaluationIssue> }
  | { type: 'SET_SUGGESTED_PLANS'; plans: AccessibilityPlan[] }
  | { type: 'ADD_TO_HISTORY'; result: EvaluationResult }
  | { type: 'CLEAR_EVALUATION' }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'CLEAR_ERROR' };

export class EvaluationController {
  private static instance: EvaluationController;
  private evaluationState: EvaluationState = {
    currentEvaluation: null,
    selectedPlan: null,
    suggestedPlans: [],
    checklist: {},
    isLoading: false,
    error: null,
    evaluationHistory: []
  };
  private listeners: Array<(state: EvaluationState) => void> = [];

  /**
   * Singleton pattern para garantir uma única instância
   */
  static getInstance(): EvaluationController {
    if (!EvaluationController.instance) {
      EvaluationController.instance = new EvaluationController();
    }
    return EvaluationController.instance;
  }

  /**
   * Subscriber pattern para notificar mudanças de estado
   */
  subscribe(listener: (state: EvaluationState) => void): () => void {
    this.listeners.push(listener);
    
    // Retorna função de unsubscribe
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Notifica todos os listeners sobre mudanças de estado
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.evaluationState));
  }

  /**
   * Reducer para gerenciar mudanças de estado
   */
  private dispatch(action: EvaluationAction): void {
    switch (action.type) {
      case 'EVALUATION_START':
        this.evaluationState = {
          ...this.evaluationState,
          isLoading: true,
          error: null
        };
        break;
      
      case 'EVALUATION_SUCCESS':
        const suggestedPlans = EvaluationModel.suggestPlans(action.result.score);
        this.evaluationState = {
          ...this.evaluationState,
          currentEvaluation: action.result,
          suggestedPlans,
          isLoading: false,
          error: null
        };
        break;
      
      case 'EVALUATION_ERROR':
        this.evaluationState = {
          ...this.evaluationState,
          isLoading: false,
          error: action.error
        };
        break;
      
      case 'SELECT_PLAN':
        const checklist = EvaluationModel.createChecklist(
          this.evaluationState.currentEvaluation?.issues || [],
          action.plan
        );
        this.evaluationState = {
          ...this.evaluationState,
          selectedPlan: action.plan,
          checklist
        };
        break;
      
      case 'CLEAR_PLAN':
        this.evaluationState = {
          ...this.evaluationState,
          selectedPlan: null,
          checklist: {}
        };
        break;
      
      case 'UPDATE_CHECKLIST':
        this.evaluationState = {
          ...this.evaluationState,
          checklist: action.checklist
        };
        break;
      
      case 'SET_SUGGESTED_PLANS':
        this.evaluationState = {
          ...this.evaluationState,
          suggestedPlans: action.plans
        };
        break;
      
      case 'ADD_TO_HISTORY':
        this.evaluationState = {
          ...this.evaluationState,
          evaluationHistory: [action.result, ...this.evaluationState.evaluationHistory]
        };
        break;
      
      case 'CLEAR_EVALUATION':
        this.evaluationState = {
          ...this.evaluationState,
          currentEvaluation: null,
          selectedPlan: null,
          checklist: {},
          suggestedPlans: []
        };
        break;
      
      case 'SET_ERROR':
        this.evaluationState = {
          ...this.evaluationState,
          error: action.error
        };
        break;
      
      case 'CLEAR_ERROR':
        this.evaluationState = {
          ...this.evaluationState,
          error: null
        };
        break;
    }
    
    this.notifyListeners();
  }

  /**
   * Avalia um site
   * @param siteUrl - URL do site a ser avaliado
   * @returns Promise com resultado da avaliação
   */
  async evaluateSite(siteUrl: string): Promise<EvaluationResult> {
    this.dispatch({ type: 'EVALUATION_START' });
    this.dispatch({ type: 'CLEAR_ERROR' });

    try {
      // Valida URL
      if (!EvaluationModel.isValidUrl(siteUrl)) {
        throw new Error('URL inválida');
      }

      // Realiza avaliação usando o modelo
      const result = await EvaluationModel.evaluateSite(siteUrl);
      
      this.dispatch({ type: 'EVALUATION_SUCCESS', result });
      this.dispatch({ type: 'ADD_TO_HISTORY', result });
      
      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao avaliar site';
      this.dispatch({ type: 'EVALUATION_ERROR', error: errorMessage });
      throw error;
    }
  }

  /**
   * Seleciona um plano de acessibilidade
   * @param plan - Nível do plano ('A', 'AA', 'AAA')
   */
  selectPlan(plan: 'A' | 'AA' | 'AAA'): void {
    this.dispatch({ type: 'SELECT_PLAN', plan });
  }

  /**
   * Limpa seleção de plano
   */
  clearPlan(): void {
    this.dispatch({ type: 'CLEAR_PLAN' });
  }

  /**
   * Atualiza prioridade de um item no checklist
   * @param itemId - ID do item
   * @param priority - Nova prioridade (1-5)
   */
  updateItemPriority(itemId: string, priority: number): void {
    const updatedChecklist = {
      ...this.evaluationState.checklist,
      [itemId]: {
        ...this.evaluationState.checklist[itemId],
        priority
      }
    };
    
    this.dispatch({ type: 'UPDATE_CHECKLIST', checklist: updatedChecklist });
  }

  /**
   * Adiciona item personalizado ao checklist
   * @param text - Texto do item
   * @param priority - Prioridade do item
   */
  addCustomItem(text: string, priority: number): void {
    const itemId = `custom-${Date.now()}`;
    const newItem: EvaluationIssue = {
      id: itemId,
      text: `Outros: ${text}`,
      priority,
      type: 'issue'
    };

    const updatedChecklist = {
      ...this.evaluationState.checklist,
      [itemId]: newItem
    };

    this.dispatch({ type: 'UPDATE_CHECKLIST', checklist: updatedChecklist });
  }

  /**
   * Obtém itens selecionados do checklist (com prioridade > 0)
   */
  getSelectedItems(): EvaluationIssue[] {
    return Object.values(this.evaluationState.checklist)
      .filter(item => item.priority && item.priority > 0);
  }

  /**
   * Obtém avaliação atual
   */
  getCurrentEvaluation(): EvaluationResult | null {
    return this.evaluationState.currentEvaluation;
  }

  /**
   * Obtém plano selecionado
   */
  getSelectedPlan(): 'A' | 'AA' | 'AAA' | null {
    return this.evaluationState.selectedPlan;
  }

  /**
   * Obtém planos sugeridos
   */
  getSuggestedPlans(): AccessibilityPlan[] {
    return [...this.evaluationState.suggestedPlans];
  }

  /**
   * Obtém checklist atual
   */
  getChecklist(): Record<string, EvaluationIssue> {
    return { ...this.evaluationState.checklist };
  }

  /**
   * Obtém histórico de avaliações
   */
  getEvaluationHistory(): EvaluationResult[] {
    return [...this.evaluationState.evaluationHistory];
  }

  /**
   * Obtém estado atual
   */
  getState(): EvaluationState {
    return { ...this.evaluationState };
  }

  /**
   * Limpa avaliação atual
   */
  clearCurrentEvaluation(): void {
    this.dispatch({ type: 'CLEAR_EVALUATION' });
  }

  /**
   * Limpa mensagens de erro
   */
  clearError(): void {
    this.dispatch({ type: 'CLEAR_ERROR' });
  }

  /**
   * Obtém critérios WCAG por nível
   * @param level - Nível WCAG
   */
  getWCAGItems(level: 'A' | 'AA' | 'AAA'): WCAGItem[] {
    return EvaluationModel.getWCAGItems(level);
  }

  /**
   * Obtém descrição de um nível WCAG
   * @param level - Nível WCAG
   */
  getLevelDescription(level: 'A' | 'AA' | 'AAA'): string {
    return EvaluationModel.getLevelDescription(level);
  }

  /**
   * Calcula prioridade média dos itens selecionados
   */
  calculateAveragePriority(): number {
    const selectedItems = this.getSelectedItems();
    return EvaluationModel.calculateAveragePriority(selectedItems);
  }

  /**
   * Valida se pode prosseguir com a solicitação
   */
  canProceedWithRequest(): boolean {
    return !!(
      this.evaluationState.selectedPlan &&
      this.evaluationState.currentEvaluation &&
      this.getSelectedItems().length > 0
    );
  }

  /**
   * Formata URL para exibição
   * @param url - URL a ser formatada
   */
  formatUrl(url: string): string {
    return EvaluationModel.formatUrl(url);
  }

  /**
   * Obtém todas as informações necessárias para criar uma solicitação
   */
  getRequestData(): {
    plan: 'A' | 'AA' | 'AAA';
    issues: EvaluationIssue[];
    siteUrl: string;
  } | null {
    if (!this.canProceedWithRequest()) {
      return null;
    }

    return {
      plan: this.evaluationState.selectedPlan!,
      issues: this.getSelectedItems(),
      siteUrl: this.evaluationState.currentEvaluation!.siteUrl
    };
  }
}

// EXPANSÃO FUTURA:
// - Integração com ferramentas reais de avaliação
// - Salvamento de avaliações no servidor
// - Comparação entre avaliações
// - Relatórios detalhados
// - Análise de tendências
// - Integração com APIs de acessibilidade
// - Sistema de templates de checklist
// - Exportação de relatórios em PDF


