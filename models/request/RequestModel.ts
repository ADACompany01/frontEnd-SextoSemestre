/**
 * RequestModel - Modelo de dados para solicitações de acessibilidade
 * 
 * Responsabilidades:
 * - Gerenciar dados de solicitações (orçamentos e contratos)
 * - Controlar fluxo de status das solicitações
 * - Validar transições de status
 * - Integração com API do backend
 * - Regras de negócio para solicitações
 */

import ApiService from '../../services/ApiService';
import { API_BASE_URL } from '../../config/api.config';

export interface ChecklistItem {
  text: string;
  priority: number;
}

export interface FileData {
  name: string;
  url: string;
}

export interface AccessibilityRequest {
  id: number;
  clientName: string;
  site: string;
  plan: 'A' | 'AA' | 'AAA';
  status: RequestStatus;
  developmentStatus?: DevelopmentStatus;
  quoteFile?: FileData;
  contractFile?: FileData;
  contractSignedUrl?: string;
  selectedIssues: ChecklistItem[];
  createdAt?: Date;
  updatedAt?: Date;
}

export type RequestStatus = 
  | 'Awaiting Quote' 
  | 'Quote Sent'
  | 'Quote Approved'
  | 'Contract Sent' 
  | 'Contract Signed'
  | 'In Development' 
  | 'Completed';

export type DevelopmentStatus = 
  | 'Analysis'
  | 'Development'
  | 'Testing'
  | 'Done';

export interface StatusConfig {
  steps: string[];
  map: Record<RequestStatus, string>;
  nextStatus: Record<RequestStatus, RequestStatus | null>;
  developmentSteps: string[];
}

export class RequestModel {
  private static api = ApiService;
  private static USE_API = true; // Flag para controlar uso da API
  
  // Configuração de status das solicitações
  private static readonly STATUS_CONFIG: StatusConfig = {
    steps: ["Solicitação enviada", "Orçamento", "Contrato", "Desenvolvimento", "Finalizado"],
    map: {
      'Awaiting Quote': "Solicitação enviada",
      'Quote Sent': "Orçamento",
      'Quote Approved': "Orçamento",
      'Contract Sent': "Contrato",
      'Contract Signed': "Contrato",
      'In Development': "Desenvolvimento",
      'Completed': "Finalizado",
    },
    nextStatus: {
      'Awaiting Quote': 'Quote Sent',
      'Quote Sent': 'Quote Approved',
      'Quote Approved': 'Contract Sent',
      'Contract Sent': 'Contract Signed',
      'Contract Signed': 'In Development',
      'In Development': 'Completed',
      'Completed': null, // Status final
    },
    developmentSteps: ["Em Análise", "Em Desenvolvimento", "Em Teste", "Concluído"]
  };

  // Dados mock para desenvolvimento
  private static initialRequests: AccessibilityRequest[] = [
    { 
      id: 1, 
      clientName: 'Tech Solutions Inc.', 
      site: 'techsolutions.com', 
      plan: 'AA', 
      status: 'Contract Sent', 
      quoteFile: { name: 'orcamento_tech.pdf', url: '#' }, 
      contractFile: { name: 'contrato_tech.pdf', url: '#' }, 
      selectedIssues: [
        { text: 'Contraste de texto baixo', priority: 5 }, 
        { text: 'Imagens sem texto alternativo', priority: 4 }
      ],
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-20')
    },
    { 
      id: 2, 
      clientName: 'Global Mart', 
      site: 'globalmart.com', 
      plan: 'AAA', 
      status: 'Quote Sent', 
      quoteFile: { name: 'orcamento_global.pdf', url: '#' }, 
      selectedIssues: [
        { text: 'Links sem descrição clara', priority: 3 }
      ],
      createdAt: new Date('2024-01-18'),
      updatedAt: new Date('2024-01-19')
    },
    { 
      id: 3, 
      clientName: 'Creative Minds', 
      site: 'creativeminds.io', 
      plan: 'A', 
      status: 'In Development', 
      quoteFile: { name: 'orcamento_creative.pdf', url: '#' }, 
      contractFile: { name: 'contrato_creative.pdf', url: '#' }, 
      selectedIssues: [
        { text: 'Campos de formulário sem rótulo', priority: 5 }
      ],
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-22')
    },
    { 
      id: 4, 
      clientName: 'Alex Doe', 
      site: 'portfolio.com', 
      plan: 'A', 
      status: 'Completed', 
      quoteFile: { name: 'orcamento_alex.pdf', url: '#' }, 
      contractFile: { name: 'contrato_alex.pdf', url: '#' }, 
      selectedIssues: [
        { text: 'Contraste de texto baixo', priority: 4 }
      ],
      createdAt: new Date('2024-01-05'),
      updatedAt: new Date('2024-01-25')
    },
    { 
      id: 5, 
      clientName: 'New Ventures', 
      site: 'newventures.co', 
      plan: 'AA', 
      status: 'Awaiting Quote', 
      selectedIssues: [],
      createdAt: new Date('2024-01-28'),
      updatedAt: new Date('2024-01-28')
    },
  ];

  /**
   * Obtém configuração de status
   */
  static getStatusConfig(): StatusConfig {
    return { ...this.STATUS_CONFIG };
  }

  /**
   * Obtém dados mock iniciais
   */
  static getInitialRequests(): AccessibilityRequest[] {
    return [...this.initialRequests];
  }

  /**
   * Busca todas as solicitações (orçamentos e contratos) da API
   * @returns Promise com lista de solicitações
   */
  static async getAllRequests(): Promise<{ success: boolean; data?: AccessibilityRequest[]; error?: string }> {
    try {
      if (!this.USE_API) {
        return { success: true, data: this.getInitialRequests() };
      }

      console.log('[RequestModel] Buscando solicitações via API...');

      // Buscar solicitações, orçamentos e contratos em paralelo
      const [requestsResponse, budgetsResponse, contractsResponse] = await Promise.all([
        this.api.getRequests().catch(() => ({ success: false, data: [] })), // Se falhar, usar array vazio
        this.api.getBudgets(),
        this.api.getContracts()
      ]);

      if (!budgetsResponse.success && !contractsResponse.success) {
        console.warn('[RequestModel] Falha na API, usando dados mock...');
        return { success: true, data: this.getInitialRequests() };
      }

      // Combinar solicitações, orçamentos e contratos
      const requests: AccessibilityRequest[] = [];

      // Processar solicitações pendentes (criadas por clientes)
      if (requestsResponse.success && requestsResponse.data) {
        const requestsArray = Array.isArray(requestsResponse.data) 
          ? requestsResponse.data 
          : (requestsResponse.data.data || []);
        
        requestsArray.forEach((solicitacao: any) => {
          // Processar todas as solicitações, não apenas PENDENTE ou EM_ANALISE
          const cliente = solicitacao.cliente;
          const id = solicitacao.id_solicitacao 
            ? Math.abs(solicitacao.id_solicitacao.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0)) % 1000000000
            : Date.now();
          
          // Mapear status do backend para status do frontend
          let status: RequestStatus = 'Awaiting Quote';
          if (solicitacao.status === 'ORCAMENTO_CRIADO') {
            status = 'Quote Sent';
          } else if (solicitacao.status === 'ORCAMENTO_APROVADO') {
            status = 'Quote Approved';
          } else if (solicitacao.status === 'PENDENTE' || solicitacao.status === 'EM_ANALISE') {
            status = 'Awaiting Quote';
          }
          
          // Se já tem orçamento criado, buscar informações do orçamento
          let quoteFile: { name: string; url: string } | undefined;
          if (solicitacao.cod_orcamento) {
            // Tentar encontrar o orçamento na lista de orçamentos já carregados
            const budgetsArray = Array.isArray(budgetsResponse.data) 
              ? budgetsResponse.data 
              : (budgetsResponse.data?.data || []);
            
            const orcamento = budgetsArray.find((b: any) => 
              (b.cod_orcamento || b.id) === solicitacao.cod_orcamento
            );
            
            if (orcamento?.arquivo_orcamento) {
              // Construir URL completa do arquivo
              const apiBaseUrl = API_BASE_URL || 'http://192.168.1.7:3000';
              let filePath = orcamento.arquivo_orcamento;
              
              // Se não começar com http, construir URL completa
              if (!filePath.startsWith('http')) {
                // Se já começar com /uploads, usar diretamente
                if (filePath.startsWith('/uploads/')) {
                  filePath = `${apiBaseUrl}${filePath}`;
                } else if (filePath.startsWith('uploads/')) {
                  filePath = `${apiBaseUrl}/${filePath}`;
                } else {
                  // Caso contrário, assumir que está em /uploads/
                  filePath = `${apiBaseUrl}/uploads/${filePath}`;
                }
              }
              
              quoteFile = {
                name: orcamento.arquivo_orcamento.split('/').pop() || 'orcamento.pdf',
                url: filePath
              };
              
              console.log('[RequestModel] Arquivo de orçamento encontrado:', {
                originalPath: orcamento.arquivo_orcamento,
                finalUrl: filePath,
                quoteFile
              });
            }
          }
          
          requests.push({
            id,
            clientName: cliente?.nome_completo || 'Cliente Desconhecido',
            site: solicitacao.site || '',
            plan: this.mapPlanFromBackend(solicitacao.tipo_pacote),
            status,
            quoteFile,
            selectedIssues: solicitacao.selected_issues || [],
            createdAt: solicitacao.createdAt ? new Date(solicitacao.createdAt) : new Date(),
            updatedAt: solicitacao.updatedAt ? new Date(solicitacao.updatedAt) : new Date(),
            _idSolicitacao: solicitacao.id_solicitacao,
            _codOrcamento: solicitacao.cod_orcamento
          } as any);
        });
      }

      // Processar orçamentos
      if (budgetsResponse.success && budgetsResponse.data) {
        // O backend retorna { statusCode, message, data: [...] } para orçamentos
        const budgetsArray = Array.isArray(budgetsResponse.data) 
          ? budgetsResponse.data 
          : (budgetsResponse.data.data || []);
        
        budgetsArray.forEach((budget: any) => {
          // Mapear campos do backend para o formato do frontend
          const cliente = budget.pacote?.cliente || budget.cliente;
          const codOrcamento = budget.cod_orcamento || budget.id;
          
          // Gerar ID numérico a partir do UUID (usando hash simples)
          const id = codOrcamento 
            ? Math.abs(codOrcamento.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0)) % 1000000000
            : Date.now();
          
          requests.push({
            id,
            clientName: cliente?.nome_completo || cliente?.nome_razao_social || 'Cliente Desconhecido',
            site: budget.site || '',
            plan: this.mapPlanFromBackend(budget.pacote?.tipo_pacote),
            status: 'Quote Sent',
            quoteFile: budget.arquivo_orcamento ? (() => {
              const apiBaseUrl = API_BASE_URL || 'http://192.168.1.7:3000';
              const filePath = budget.arquivo_orcamento.startsWith('http') 
                ? budget.arquivo_orcamento 
                : `${apiBaseUrl}/${budget.arquivo_orcamento}`;
              return {
                name: budget.arquivo_orcamento.split('/').pop() || 'orcamento.pdf',
                url: filePath
              };
            })() : undefined,
            selectedIssues: [],
            createdAt: budget.createdAt ? new Date(budget.createdAt) : (budget.created_at ? new Date(budget.created_at) : new Date()),
            updatedAt: budget.updatedAt ? new Date(budget.updatedAt) : (budget.updated_at ? new Date(budget.updated_at) : new Date()),
            // Armazenar cod_orcamento para relacionar com contratos
            _codOrcamento: codOrcamento
          } as any);
        });
      }

      // Processar contratos
      if (contractsResponse.success && contractsResponse.data) {
        // O backend retorna array direto para contratos
        const contractsArray = Array.isArray(contractsResponse.data) 
          ? contractsResponse.data 
          : [];
        
        contractsArray.forEach((contract: any) => {
          // Mapear campos do backend para o formato do frontend
          const orcamento = contract.orcamento;
          const cliente = orcamento?.pacote?.cliente || contract.cliente;
          const codOrcamento = contract.cod_orcamento || contract.orcamento_id;
          const idContrato = contract.id_contrato || contract.id;
          
          // Verificar se já existe um orçamento para este código de orçamento
          const existingIndex = requests.findIndex((r: any) => {
            // Tentar encontrar pelo cod_orcamento armazenado
            return codOrcamento && r._codOrcamento === codOrcamento;
          });
          
          // Determinar status baseado no status_contrato
          let status: RequestStatus = 'Contract Sent';
          if (contract.status_contrato === 'CONCLUIDO' || contract.contrato_assinado_url) {
            status = 'Contract Signed';
          } else if (contract.status_contrato === 'EM_ANDAMENTO') {
            status = 'In Development';
          }
          
          if (existingIndex >= 0) {
            // Atualizar solicitação existente com dados do contrato
            requests[existingIndex] = {
              ...requests[existingIndex],
              status,
              contractFile: contract.arquivo_contrato ? {
                name: contract.arquivo_contrato.split('/').pop() || 'contrato.pdf',
                url: contract.arquivo_contrato
              } : undefined,
              contractSignedUrl: contract.contrato_assinado_url
            };
          } else {
            // Criar nova solicitação a partir do contrato
            const id = idContrato 
              ? Math.abs(idContrato.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0)) % 1000000000
              : Date.now();
            
            requests.push({
              id,
              clientName: cliente?.nome_completo || cliente?.nome_razao_social || 'Cliente Desconhecido',
              site: contract.site || '',
              plan: this.mapPlanFromBackend(orcamento?.pacote?.tipo_pacote) || 'AA',
              status,
              contractFile: contract.arquivo_contrato ? {
                name: contract.arquivo_contrato.split('/').pop() || 'contrato.pdf',
                url: contract.arquivo_contrato
              } : undefined,
              contractSignedUrl: contract.contrato_assinado_url,
              selectedIssues: [],
              createdAt: contract.createdAt ? new Date(contract.createdAt) : (contract.created_at ? new Date(contract.created_at) : new Date()),
              updatedAt: contract.updatedAt ? new Date(contract.updatedAt) : (contract.updated_at ? new Date(contract.updated_at) : new Date()),
              // Armazenar cod_orcamento para relacionar com orçamentos
              _codOrcamento: codOrcamento
            } as any);
          }
        });
      }

      console.log(`[RequestModel] ${requests.length} solicitações carregadas da API`);
      return { success: true, data: requests };
    } catch (error) {
      console.error('[RequestModel] Erro ao buscar solicitações:', error);
      // Fallback para dados mock
      return { success: true, data: this.getInitialRequests() };
    }
  }

  /**
   * Mapeia plano do backend para o formato do frontend
   */
  private static mapPlanFromBackend(nivel?: string): 'A' | 'AA' | 'AAA' {
    if (!nivel) return 'AA';
    const upperNivel = nivel.toUpperCase();
    if (upperNivel === 'A' || upperNivel === 'AA' || upperNivel === 'AAA') {
      return upperNivel as 'A' | 'AA' | 'AAA';
    }
    return 'AA';
  }

  /**
   * Cria novo orçamento via API
   */
  static async createBudget(budgetData: {
    cliente_id: number;
    pacote_id: number;
    valor: number;
    observacoes?: string;
  }): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      if (!this.USE_API) {
        return { success: false, error: 'API desabilitada' };
      }

      console.log('[RequestModel] Criando orçamento via API...');
      return await this.api.createBudget(budgetData);
    } catch (error) {
      console.error('[RequestModel] Erro ao criar orçamento:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Cria novo contrato via API
   */
  static async createContract(contractData: {
    cliente_id: number;
    orcamento_id: number;
    data_inicio: string;
    data_fim: string;
    valor: number;
  }): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      if (!this.USE_API) {
        return { success: false, error: 'API desabilitada' };
      }

      console.log('[RequestModel] Criando contrato via API...');
      return await this.api.createContract(contractData);
    } catch (error) {
      console.error('[RequestModel] Erro ao criar contrato:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Cria nova solicitação
   * @param requestData - Dados da solicitação
   * @returns Nova solicitação com ID único
   */
  static createRequest(requestData: Omit<AccessibilityRequest, 'id' | 'createdAt' | 'updatedAt'>): AccessibilityRequest {
    const now = new Date();
    return {
      ...requestData,
      id: Date.now(),
      createdAt: now,
      updatedAt: now
    };
  }

  /**
   * Atualiza status de uma solicitação
   * @param request - Solicitação a ser atualizada
   * @param newStatus - Novo status
   * @returns Solicitação atualizada ou null se transição inválida
   */
  static updateStatus(request: AccessibilityRequest, newStatus: RequestStatus): AccessibilityRequest | null {
    if (!this.isValidStatusTransition(request.status, newStatus)) {
      return null;
    }

    return {
      ...request,
      status: newStatus,
      updatedAt: new Date()
    };
  }

  /**
   * Anexa arquivo a uma solicitação
   * @param request - Solicitação
   * @param fileType - Tipo do arquivo ('quote' | 'contract')
   * @param fileData - Dados do arquivo
   * @returns Solicitação atualizada
   */
  static attachFile(
    request: AccessibilityRequest, 
    fileType: 'quote' | 'contract', 
    fileData: FileData
  ): AccessibilityRequest {
    const updatedRequest = {
      ...request,
      updatedAt: new Date()
    };

    if (fileType === 'quote') {
      updatedRequest.quoteFile = fileData;
    } else if (fileType === 'contract') {
      updatedRequest.contractFile = fileData;
    }

    return updatedRequest;
  }

  /**
   * Valida transição de status
   * @param currentStatus - Status atual
   * @param newStatus - Novo status
   * @returns true se transição é válida
   */
  static isValidStatusTransition(currentStatus: RequestStatus, newStatus: RequestStatus): boolean {
    const nextStatus = this.STATUS_CONFIG.nextStatus[currentStatus];
    return nextStatus === newStatus;
  }

  /**
   * Obtém próximo status válido
   * @param currentStatus - Status atual
   * @returns Próximo status ou null se for status final
   */
  static getNextStatus(currentStatus: RequestStatus): RequestStatus | null {
    return this.STATUS_CONFIG.nextStatus[currentStatus];
  }

  /**
   * Filtra solicitações por cliente
   * @param requests - Lista de solicitações
   * @param clientName - Nome do cliente
   * @returns Solicitações do cliente
   */
  static filterByClient(requests: AccessibilityRequest[], clientName: string): AccessibilityRequest[] {
    return requests.filter(request => request.clientName === clientName);
  }

  /**
   * Filtra solicitações ativas (não finalizadas)
   * @param requests - Lista de solicitações
   * @returns Solicitações ativas
   */
  static filterActiveRequests(requests: AccessibilityRequest[]): AccessibilityRequest[] {
    return requests.filter(request => request.status !== 'Completed');
  }

  /**
   * Valida dados de solicitação
   * @param request - Objeto solicitação
   * @returns true se válido, false se inválido
   */
  static validateRequest(request: AccessibilityRequest): boolean {
    return !!(
      request &&
      request.id &&
      request.clientName &&
      request.site &&
      ['A', 'AA', 'AAA'].includes(request.plan) &&
      Object.keys(this.STATUS_CONFIG.map).includes(request.status) &&
      Array.isArray(request.selectedIssues)
    );
  }

  /**
   * Calcula progresso da solicitação (0-100)
   * @param request - Solicitação
   * @returns Percentual de progresso
   */
  static calculateProgress(request: AccessibilityRequest): number {
    const currentStep = this.STATUS_CONFIG.steps.indexOf(this.STATUS_CONFIG.map[request.status]);
    const totalSteps = this.STATUS_CONFIG.steps.length;
    return Math.round((currentStep / (totalSteps - 1)) * 100);
  }

  /**
   * Atualiza status de desenvolvimento
   * @param request - Solicitação
   * @param developmentStatus - Novo status de desenvolvimento
   * @returns Solicitação atualizada ou null se inválido
   */
  static updateDevelopmentStatus(
    request: AccessibilityRequest,
    developmentStatus: DevelopmentStatus
  ): AccessibilityRequest | null {
    if (request.status !== 'In Development') {
      return null;
    }

    const updated = {
      ...request,
      developmentStatus,
      updatedAt: new Date()
    };

    // Se marcar como Done, muda status geral para Completed
    if (developmentStatus === 'Done') {
      updated.status = 'Completed';
    }

    return updated;
  }

  /**
   * Obtém descrição do status de desenvolvimento
   * @param status - Status de desenvolvimento
   * @returns Descrição em português
   */
  static getDevelopmentStatusLabel(status: DevelopmentStatus): string {
    const labels: Record<DevelopmentStatus, string> = {
      'Analysis': 'Em Análise',
      'Development': 'Em Desenvolvimento',
      'Testing': 'Em Teste',
      'Done': 'Concluído'
    };
    return labels[status];
  }

  /**
   * Define se deve usar API ou dados mock
   */
  static setUseApi(useApi: boolean): void {
    this.USE_API = useApi;
    console.log(`[RequestModel] Modo de operação: ${useApi ? 'API' : 'Dados mock'}`);
  }

  /**
   * Verifica se está usando API
   */
  static isUsingApi(): boolean {
    return this.USE_API;
  }
}

// EXPANSÃO FUTURA:
// - Integração com API real
// - Sistema de notificações
// - Histórico de mudanças de status
// - Upload de arquivos reais
// - Sistema de comentários
// - Integração com calendário
// - Relatórios e analytics
