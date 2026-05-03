/**
 * RequestController - Controlador de solicitações
 * 
 * Responsabilidades:
 * - Gerenciar CRUD de solicitações
 * - Controlar fluxo de status
 * - Integrar com RequestModel
 * - Validações de negócio
 */

import { RequestModel, type AccessibilityRequest, type RequestStatus, type FileData, type ChecklistItem } from '../../models';

export interface RequestState {
  requests: AccessibilityRequest[];
  selectedRequest: AccessibilityRequest | null;
  isLoading: boolean;
  error: string | null;
}

export type RequestAction = 
  | { type: 'SET_REQUESTS'; requests: AccessibilityRequest[] }
  | { type: 'ADD_REQUEST'; request: AccessibilityRequest }
  | { type: 'UPDATE_REQUEST'; request: AccessibilityRequest }
  | { type: 'DELETE_REQUEST'; requestId: number }
  | { type: 'SELECT_REQUEST'; request: AccessibilityRequest | null }
  | { type: 'SET_LOADING'; isLoading: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'CLEAR_ERROR' };

export class RequestController {
  private static instance: RequestController;
  private requestState: RequestState = {
    requests: [],
    selectedRequest: null,
    isLoading: false,
    error: null
  };
  private listeners: Array<(state: RequestState) => void> = [];

  /**
   * Singleton pattern para garantir uma única instância
   */
  static getInstance(): RequestController {
    if (!RequestController.instance) {
      RequestController.instance = new RequestController();
      // Inicializa com dados mock
      RequestController.instance.initializeWithMockData();
    }
    return RequestController.instance;
  }

  /**
   * Inicializa com dados mock para desenvolvimento
   */
  private initializeWithMockData(): void {
    const mockRequests = RequestModel.getInitialRequests();
    this.dispatch({ type: 'SET_REQUESTS', requests: mockRequests });
  }

  /**
   * Subscriber pattern para notificar mudanças de estado
   */
  subscribe(listener: (state: RequestState) => void): () => void {
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
    this.listeners.forEach(listener => listener(this.requestState));
  }

  /**
   * Reducer para gerenciar mudanças de estado
   */
  private dispatch(action: RequestAction): void {
    switch (action.type) {
      case 'SET_REQUESTS':
        this.requestState = {
          ...this.requestState,
          requests: action.requests
        };
        break;
      
      case 'ADD_REQUEST':
        this.requestState = {
          ...this.requestState,
          requests: [action.request, ...this.requestState.requests]
        };
        break;
      
      case 'UPDATE_REQUEST':
        this.requestState = {
          ...this.requestState,
          requests: this.requestState.requests.map(req => 
            req.id === action.request.id ? action.request : req
          ),
          selectedRequest: this.requestState.selectedRequest?.id === action.request.id 
            ? action.request 
            : this.requestState.selectedRequest
        };
        break;
      
      case 'DELETE_REQUEST':
        this.requestState = {
          ...this.requestState,
          requests: this.requestState.requests.filter(req => req.id !== action.requestId),
          selectedRequest: this.requestState.selectedRequest?.id === action.requestId 
            ? null 
            : this.requestState.selectedRequest
        };
        break;
      
      case 'SELECT_REQUEST':
        this.requestState = {
          ...this.requestState,
          selectedRequest: action.request
        };
        break;
      
      case 'SET_LOADING':
        this.requestState = {
          ...this.requestState,
          isLoading: action.isLoading
        };
        break;
      
      case 'SET_ERROR':
        this.requestState = {
          ...this.requestState,
          error: action.error
        };
        break;
      
      case 'CLEAR_ERROR':
        this.requestState = {
          ...this.requestState,
          error: null
        };
        break;
    }
    
    this.notifyListeners();
  }

  /**
   * Cria nova solicitação
   * @param requestData - Dados da solicitação
   * @param clientEmail - Email do cliente (opcional, para salvar no backend)
   * @returns Promise com a solicitação criada
   */
  async createRequest(
    requestData: Omit<AccessibilityRequest, 'id' | 'createdAt' | 'updatedAt'>,
    clientEmail?: string
  ): Promise<AccessibilityRequest> {
    this.dispatch({ type: 'SET_LOADING', isLoading: true });
    this.dispatch({ type: 'CLEAR_ERROR' });

    try {
      // Valida dados usando o modelo
      const tempRequest = RequestModel.createRequest(requestData);
      
      if (!RequestModel.validateRequest(tempRequest)) {
        throw new Error('Dados da solicitação inválidos');
      }

      // Tentar salvar no backend se o email do cliente foi fornecido
      if (clientEmail && RequestModel.isUsingApi()) {
        try {
          console.log('[RequestController] Tentando salvar solicitação no backend...');
          
          // Importar ApiService dinamicamente
          const ApiService = (await import('../../services/ApiService')).default;
          
          // Criar solicitação no backend
          const solicitacaoResponse = await ApiService.createRequest({
            site: requestData.site,
            tipo_pacote: requestData.plan,
            observacoes: `Solicitação para o site: ${requestData.site}`,
            selected_issues: requestData.selectedIssues,
          });
          
          if (solicitacaoResponse.success) {
            console.log('[RequestController] Solicitação salva no backend com sucesso!');
          } else {
            console.warn('[RequestController] Erro ao criar solicitação no backend:', solicitacaoResponse.error);
          }
        } catch (backendError) {
          // Não falhar a criação local se houver erro no backend
          console.error('[RequestController] Erro ao salvar no backend (continuando localmente):', backendError);
        }
      }

      // Adiciona à lista local
      this.dispatch({ type: 'ADD_REQUEST', request: tempRequest });
      
      return tempRequest;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao criar solicitação';
      this.dispatch({ type: 'SET_ERROR', error: errorMessage });
      throw error;
    } finally {
      this.dispatch({ type: 'SET_LOADING', isLoading: false });
    }
  }

  /**
   * Atualiza status de uma solicitação
   * @param requestId - ID da solicitação
   * @param newStatus - Novo status
   * @returns Promise com a solicitação atualizada
   */
  async updateRequestStatus(requestId: number, newStatus: RequestStatus): Promise<AccessibilityRequest> {
    this.dispatch({ type: 'SET_LOADING', isLoading: true });
    this.dispatch({ type: 'CLEAR_ERROR' });

    try {
      const existingRequest = this.requestState.requests.find(req => req.id === requestId);
      
      if (!existingRequest) {
        throw new Error('Solicitação não encontrada');
      }

      // Atualiza status usando o modelo
      const updatedRequest = RequestModel.updateStatus(existingRequest, newStatus);
      
      if (!updatedRequest) {
        throw new Error('Transição de status inválida');
      }

      // Atualiza na lista
      this.dispatch({ type: 'UPDATE_REQUEST', request: updatedRequest });
      
      return updatedRequest;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar solicitação';
      this.dispatch({ type: 'SET_ERROR', error: errorMessage });
      throw error;
    } finally {
      this.dispatch({ type: 'SET_LOADING', isLoading: false });
    }
  }

  /**
   * Anexa arquivo a uma solicitação
   * @param requestId - ID da solicitação
   * @param fileType - Tipo do arquivo
   * @param fileData - Dados do arquivo
   * @returns Promise com a solicitação atualizada
   */
  async attachFileToRequest(
    requestId: number, 
    fileType: 'quote' | 'contract', 
    fileData: FileData
  ): Promise<AccessibilityRequest> {
    this.dispatch({ type: 'SET_LOADING', isLoading: true });
    this.dispatch({ type: 'CLEAR_ERROR' });

    try {
      const existingRequest = this.requestState.requests.find(req => req.id === requestId);
      
      if (!existingRequest) {
        throw new Error('Solicitação não encontrada');
      }

      // Anexa arquivo usando o modelo
      const updatedRequest = RequestModel.attachFile(existingRequest, fileType, fileData);
      
      // Atualiza status se necessário
      const nextStatus = RequestModel.getNextStatus(updatedRequest.status);
      if (nextStatus) {
        const finalRequest = RequestModel.updateStatus(updatedRequest, nextStatus);
        this.dispatch({ type: 'UPDATE_REQUEST', request: finalRequest });
        return finalRequest;
      } else {
        this.dispatch({ type: 'UPDATE_REQUEST', request: updatedRequest });
        return updatedRequest;
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao anexar arquivo';
      this.dispatch({ type: 'SET_ERROR', error: errorMessage });
      throw error;
    } finally {
      this.dispatch({ type: 'SET_LOADING', isLoading: false });
    }
  }

  /**
   * Atualiza status de desenvolvimento
   * @param requestId - ID da solicitação
   * @param developmentStatus - Novo status de desenvolvimento
   * @returns Promise com a solicitação atualizada
   */
  async updateDevelopmentStatus(
    requestId: number,
    developmentStatus: any
  ): Promise<AccessibilityRequest> {
    this.dispatch({ type: 'SET_LOADING', isLoading: true });
    this.dispatch({ type: 'CLEAR_ERROR' });

    try {
      const existingRequest = this.requestState.requests.find(req => req.id === requestId);
      
      if (!existingRequest) {
        throw new Error('Solicitação não encontrada');
      }

      const updatedRequest = RequestModel.updateDevelopmentStatus(existingRequest, developmentStatus);
      
      if (!updatedRequest) {
        throw new Error('Não é possível atualizar status de desenvolvimento nesta etapa');
      }

      this.dispatch({ type: 'UPDATE_REQUEST', request: updatedRequest });
      
      return updatedRequest;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar status de desenvolvimento';
      this.dispatch({ type: 'SET_ERROR', error: errorMessage });
      throw error;
    } finally {
      this.dispatch({ type: 'SET_LOADING', isLoading: false });
    }
  }

  /**
   * Seleciona uma solicitação
   * @param request - Solicitação a ser selecionada (ou null para deselecionar)
   */
  selectRequest(request: AccessibilityRequest | null): void {
    this.dispatch({ type: 'SELECT_REQUEST', request });
  }

  /**
   * Obtém todas as solicitações
   */
  getAllRequests(): AccessibilityRequest[] {
    return [...this.requestState.requests];
  }

  /**
   * Obtém solicitações por cliente
   * @param clientName - Nome do cliente
   */
  getRequestsByClient(clientName: string): AccessibilityRequest[] {
    return RequestModel.filterByClient(this.requestState.requests, clientName);
  }

  /**
   * Obtém solicitações ativas
   */
  getActiveRequests(): AccessibilityRequest[] {
    return RequestModel.filterActiveRequests(this.requestState.requests);
  }

  /**
   * Obtém solicitação por ID
   * @param requestId - ID da solicitação
   */
  getRequestById(requestId: number): AccessibilityRequest | null {
    return this.requestState.requests.find(req => req.id === requestId) || null;
  }

  /**
   * Obtém solicitação selecionada
   */
  getSelectedRequest(): AccessibilityRequest | null {
    return this.requestState.selectedRequest;
  }

  /**
   * Obtém estado atual
   */
  getState(): RequestState {
    return { ...this.requestState };
  }

  /**
   * Carrega solicitações do backend
   */
  async loadRequestsFromApi(): Promise<void> {
    this.dispatch({ type: 'SET_LOADING', isLoading: true });
    this.dispatch({ type: 'CLEAR_ERROR' });

    try {
      if (!RequestModel.isUsingApi()) {
        console.log('[RequestController] API desabilitada, usando dados mock');
        const mockRequests = RequestModel.getInitialRequests();
        this.dispatch({ type: 'SET_REQUESTS', requests: mockRequests });
        return;
      }

      console.log('[RequestController] Carregando solicitações do backend...');
      const response = await RequestModel.getAllRequests();
      
      if (response.success && response.data) {
        console.log(`[RequestController] ${response.data.length} solicitações carregadas do backend`);
        this.dispatch({ type: 'SET_REQUESTS', requests: response.data });
      } else {
        console.warn('[RequestController] Erro ao carregar solicitações, usando dados mock');
        const mockRequests = RequestModel.getInitialRequests();
        this.dispatch({ type: 'SET_REQUESTS', requests: mockRequests });
      }
    } catch (error) {
      console.error('[RequestController] Erro ao carregar solicitações:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao carregar solicitações';
      this.dispatch({ type: 'SET_ERROR', error: errorMessage });
      
      // Fallback para dados mock
      const mockRequests = RequestModel.getInitialRequests();
      this.dispatch({ type: 'SET_REQUESTS', requests: mockRequests });
    } finally {
      this.dispatch({ type: 'SET_LOADING', isLoading: false });
    }
  }

  /**
   * Limpa mensagens de erro
   */
  clearError(): void {
    this.dispatch({ type: 'CLEAR_ERROR' });
  }

  /**
   * Obtém configuração de status
   */
  getStatusConfig() {
    return RequestModel.getStatusConfig();
  }

  /**
   * Calcula progresso de uma solicitação
   * @param requestId - ID da solicitação
   */
  calculateProgress(requestId: number): number {
    const request = this.getRequestById(requestId);
    return request ? RequestModel.calculateProgress(request) : 0;
  }

  /**
   * Valida se uma ação pode ser executada em uma solicitação
   * @param request - Solicitação
   * @param action - Ação a ser validada
   */
  canExecuteAction(request: AccessibilityRequest, action: string): boolean {
    switch (action) {
      case 'sendQuote':
        return request.status === 'Awaiting Quote';
      case 'attachContract':
        return request.status === 'Quote Sent';
      case 'startDevelopment':
        return request.status === 'Contract Sent';
      case 'complete':
        return request.status === 'In Development';
      default:
        return false;
    }
  }

  /**
   * Assina um contrato digitalmente
   * @param requestId - ID da solicitação/contrato
   * @param signatureBase64 - Assinatura em base64
   * @returns Promise com a solicitação atualizada
   */
  async signContract(requestId: number, signatureBase64: string): Promise<AccessibilityRequest> {
    this.dispatch({ type: 'SET_LOADING', isLoading: true });
    this.dispatch({ type: 'CLEAR_ERROR' });

    try {
      const existingRequest = this.requestState.requests.find(req => req.id === requestId);
      
      if (!existingRequest) {
        throw new Error('Solicitação não encontrada');
      }

      // Importar ApiService dinamicamente para evitar dependência circular
      const ApiService = (await import('../../services/ApiService')).default;
      
      // Chamar API para assinar contrato
      // Nota: Você precisará obter o ID do contrato a partir da solicitação
      // Por enquanto, vamos usar o requestId como contratoId
      const response = await ApiService.signContract(
        requestId.toString(),
        signatureBase64
      );

      if (!response.success) {
        throw new Error(response.error || 'Erro ao assinar contrato');
      }

      // Atualizar status da solicitação para 'Contract Signed'
      const nextStatus = RequestModel.getStatusConfig().nextStatus['Contract Sent'];
      if (nextStatus) {
        const updatedRequest = await this.updateRequestStatus(requestId, nextStatus);
        return updatedRequest;
      }

      // Se não houver próximo status, apenas retornar a solicitação atualizada
      this.dispatch({ type: 'UPDATE_REQUEST', request: existingRequest });
      return existingRequest;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao assinar contrato';
      this.dispatch({ type: 'SET_ERROR', error: errorMessage });
      throw error;
    } finally {
      this.dispatch({ type: 'SET_LOADING', isLoading: false });
    }
  }
}

// EXPANSÃO FUTURA:
// - Integração com API real
// - Upload de arquivos reais
// - Sistema de notificações
// - Histórico de mudanças
// - Filtros e busca avançada
// - Paginação
// - Exportação de relatórios
// - Integração com calendário
// - Sistema de comentários
