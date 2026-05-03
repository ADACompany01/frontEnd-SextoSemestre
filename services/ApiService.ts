/**
 * ApiService - Serviço centralizado para comunicação com o backend
 * 
 * Responsabilidades:
 * - Gerenciar todas as requisições HTTP para o backend
 * - Configurar headers, autenticação e interceptadores
 * - Tratar erros de forma centralizada
 * - Gerenciar tokens JWT
 */

import axios, { AxiosInstance, AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { API_CONFIG, API_ENDPOINTS, HTTP_STATUS } from '../config/api.config';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
}

export class ApiService {
  private static instance: ApiService;
  private axiosInstance: AxiosInstance;
  private authToken: string | null = null;

  /**
   * Singleton pattern
   */
  static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  private constructor() {
    // Criar instância do axios com configurações base
    this.axiosInstance = axios.create(API_CONFIG);

    // Configurar interceptadores
    this.setupInterceptors();
  }

  /**
   * Configura interceptadores de requisição e resposta
   */
  private setupInterceptors(): void {
    // Interceptador de requisição - adiciona token JWT se disponível
    this.axiosInstance.interceptors.request.use(
      (config) => {
        if (this.authToken) {
          config.headers.Authorization = `Bearer ${this.authToken}`;
          console.log('[API] Token JWT adicionado à requisição');
        } else {
          console.warn('[API] Token JWT não encontrado - requisição será feita sem autenticação');
        }
        
        // Para FormData, remover Content-Type para deixar o browser/axios definir automaticamente
        // Isso é necessário para que o boundary seja adicionado corretamente
        if (config.data instanceof FormData) {
          delete config.headers['Content-Type'];
          // No React Native, garantir que não há Content-Type definido
          delete config.headers['content-type'];
          console.log('[API] FormData detectado - Content-Type removido para permitir boundary automático');
        }
        
        const fullUrl = config.baseURL ? `${config.baseURL}${config.url}` : config.url;
        console.log(`[API] ${config.method?.toUpperCase()} ${config.url} (URL completa: ${fullUrl})`);
        return config;
      },
      (error) => {
        console.error('[API] Erro na requisição:', error);
        return Promise.reject(error);
      }
    );

    // Interceptador de resposta - trata erros globalmente
    this.axiosInstance.interceptors.response.use(
      (response) => {
        console.log(`[API] Resposta recebida: ${response.status}`);
        return response;
      },
      (error: AxiosError) => {
        return this.handleResponseError(error);
      }
    );
  }

  /**
   * Trata erros de resposta da API
   * NOTA: Este método é usado no interceptor e sempre rejeita a Promise
   */
  private handleResponseError(error: AxiosError): Promise<never> {
    if (error.response) {
      // Servidor respondeu com status de erro
      const status = error.response.status;
      const data: any = error.response.data;
      
      console.error(`[API] Erro ${status}:`, data);
      
      // Extrair mensagem de erro do backend
      let errorMessage = 'Erro na requisição';
      if (typeof data === 'string') {
        errorMessage = data;
      } else if (data?.message) {
        errorMessage = Array.isArray(data.message) ? data.message[0] : data.message;
      } else if (data?.error) {
        errorMessage = data.error;
      }

      // Tratar casos específicos de status
      switch (status) {
        case HTTP_STATUS.UNAUTHORIZED:
          // Verificar se é erro de autenticação ou apenas de permissão
          if (errorMessage.includes('Acesso negado') || errorMessage.includes('permissão')) {
            // É apenas erro de permissão, não remover token
            console.error('[API] Acesso negado - permissão insuficiente');
          } else {
            // Token expirado ou inválido - limpar autenticação
            this.clearAuth();
          }
          break;
        
        case HTTP_STATUS.FORBIDDEN:
          console.error('[API] Acesso negado');
          break;
        
        case HTTP_STATUS.NOT_FOUND:
          console.error('[API] Recurso não encontrado');
          break;
        
        case HTTP_STATUS.TOO_MANY_REQUESTS:
          console.error('[API] Muitas requisições - aguarde um momento');
          break;
        
        case HTTP_STATUS.INTERNAL_SERVER_ERROR:
          console.error('[API] Erro interno do servidor');
          break;
      }
      
      // Rejeitar com objeto formatado incluindo statusCode
      return Promise.reject({
        success: false,
        error: errorMessage,
        statusCode: status,
        originalError: error,
      });
    } else if (error.request) {
      // Requisição foi feita mas não houve resposta
      console.error('[API] Sem resposta do servidor:', error.message);
      console.error('[API] Detalhes da requisição:', {
        url: error.config?.url,
        method: error.config?.method,
        baseURL: error.config?.baseURL,
        timeout: error.config?.timeout,
      });
      
      // Verificar se é um erro de rede ou timeout
      // NOTA: Este método é usado no interceptor e sempre rejeita a Promise
      // O método handleError (usado nos métodos HTTP) converte isso em ApiResponse
      if (error.code === 'ECONNABORTED') {
        return Promise.reject({
          success: false,
          error: 'Timeout - a requisição demorou muito para responder',
          statusCode: 408,
        });
      } else if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
        return Promise.reject({
          success: false,
          error: 'Erro de rede - verifique sua conexão com o servidor',
          statusCode: 0,
          originalError: error, // Preservar erro original para extrair statusCode se necessário
        });
      }
      
      // Erro genérico de requisição sem resposta
      return Promise.reject({
        success: false,
        error: 'Não foi possível conectar ao servidor. Verifique sua conexão.',
        statusCode: 0,
      });
    } else {
      // Erro ao configurar a requisição
      console.error('[API] Erro ao configurar requisição:', error.message);
      return Promise.reject({
        success: false,
        error: `Erro ao configurar requisição: ${error.message}`,
        statusCode: 0,
      });
    }

    // Se chegou aqui, rejeitar com erro genérico
    return Promise.reject({
      success: false,
      error: error.message || 'Erro desconhecido',
      statusCode: 0,
    });
  }

  /**
   * Define o token de autenticação
   */
  setAuthToken(token: string): void {
    this.authToken = token;
    console.log('[API] Token de autenticação definido:', token ? `${token.substring(0, 20)}...` : 'null');
  }
  
  /**
   * Verifica se há token definido
   */
  hasToken(): boolean {
    return !!this.authToken;
  }

  /**
   * Limpa o token de autenticação
   */
  clearAuth(): void {
    this.authToken = null;
    console.log('[API] Token de autenticação removido');
  }

  /**
   * Obtém o token atual
   */
  getAuthToken(): string | null {
    return this.authToken;
  }

  /**
   * Verifica se está autenticado
   */
  isAuthenticated(): boolean {
    return this.authToken !== null;
  }

  /**
   * Método GET genérico
   */
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<T> = await this.axiosInstance.get(url, config);
      return {
        success: true,
        data: response.data,
        statusCode: response.status,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Método PATCH genérico
   */
  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<T> = await this.axiosInstance.patch(url, data, config);
      return {
        success: true,
        data: response.data,
        statusCode: response.status,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Método POST genérico
   */
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      // Log adicional para FormData
      if (data instanceof FormData) {
        console.log('[API] Enviando FormData para:', url);
        // Verificar se o FormData tem dados
        if (config?.headers) {
          console.log('[API] Headers configurados:', Object.keys(config.headers));
        }
      }
      
      const response: AxiosResponse<T> = await this.axiosInstance.post(url, data, config);
      return {
        success: true,
        data: response.data,
        statusCode: response.status,
      };
    } catch (error) {
      // Log adicional para erros de upload
      if (data instanceof FormData) {
        console.error('[API] Erro ao enviar FormData:', error);
        if ((error as any).request) {
          console.error('[API] Detalhes da requisição:', {
            url: (error as any).config?.url,
            method: (error as any).config?.method,
            headers: (error as any).config?.headers,
          });
        }
      }
      return this.handleError(error);
    }
  }

  /**
   * Método PUT genérico
   */
  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<T> = await this.axiosInstance.put(url, data, config);
      return {
        success: true,
        data: response.data,
        statusCode: response.status,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Método PATCH genérico
   */
  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<T> = await this.axiosInstance.patch(url, data, config);
      return {
        success: true,
        data: response.data,
        statusCode: response.status,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Método DELETE genérico
   */
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<T> = await this.axiosInstance.delete(url, config);
      return {
        success: true,
        data: response.data,
        statusCode: response.status,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Trata erros e retorna ApiResponse padronizada
   */
  private handleError(error: any): ApiResponse {
    // Se o erro já foi formatado pelo handleResponseError (tem success, error, statusCode)
    if (error && typeof error === 'object' && 'success' in error && 'error' in error) {
      // Se o statusCode não foi definido, tentar extrair do erro original
      if (!error.statusCode && error.originalError) {
        const originalError = error.originalError;
        if (axios.isAxiosError(originalError) && originalError.response) {
          error.statusCode = originalError.response.status;
        }
      }
      console.log('[API] Erro já formatado pelo handleResponseError:', error);
      return error as ApiResponse;
    }
    
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      
      if (axiosError.response) {
        // Erro com resposta do servidor
        const data: any = axiosError.response.data;
        
        // NestJS retorna erro no formato: { statusCode, message, error }
        // Extrair a mensagem do backend
        let errorMessage = 'Erro na requisição';
        
        if (typeof data === 'string') {
          errorMessage = data;
        } else if (data?.message) {
          // NestJS geralmente coloca a mensagem em 'message'
          errorMessage = Array.isArray(data.message) ? data.message[0] : data.message;
        } else if (data?.error) {
          errorMessage = data.error;
        }
        
        return {
          success: false,
          error: errorMessage,
          statusCode: axiosError.response.status,
        };
      } else if (axiosError.request) {
        // Sem resposta do servidor
        // Verificar se é um erro de rede ou timeout
        if (axiosError.code === 'ECONNABORTED') {
          return {
            success: false,
            error: 'Timeout - a requisição demorou muito para responder',
            statusCode: 408,
          };
        } else if (axiosError.code === 'ERR_NETWORK' || axiosError.message.includes('Network Error')) {
          return {
            success: false,
            error: 'Erro de rede - verifique sua conexão com o servidor',
            statusCode: 0,
          };
        }
        
        return {
          success: false,
          error: 'Não foi possível conectar ao servidor. Verifique sua conexão.',
          statusCode: 0,
        };
      }
    }

    // Erro genérico
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }

  /**
   * Testa a conexão com a API
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.get('/health');
      return response.success;
    } catch (error) {
      console.error('[API] Falha no teste de conexão:', error);
      return false;
    }
  }

  // ===========================
  // Métodos específicos da API
  // ===========================

  /**
   * Login de usuário
   */
  async login(email: string, password: string): Promise<ApiResponse<{ token: string; user: any }>> {
    // Backend espera "senha" não "password"
    const response = await this.post(API_ENDPOINTS.AUTH.LOGIN, { email, senha: password });
    
    if (response.success && response.data?.token) {
      this.setAuthToken(response.data.token);
    }
    
    return response;
  }

  /**
   * Registrar novo usuário
   */
  async register(userData: {
    name: string;
    email: string;
    password: string;
    type?: 'client' | 'employee';
    phone?: string;
  }): Promise<ApiResponse<{ token: string; user: any }>> {
    // Backend espera campos em inglês no endpoint /auth/register
    const response = await this.post('/auth/register', userData);
    
    if (response.success && response.data?.token) {
      this.setAuthToken(response.data.token);
    }
    
    return response;
  }

  /**
   * Obtém token de teste (para desenvolvimento)
   */
  async getTestToken(): Promise<ApiResponse<{ token: string }>> {
    return this.get(API_ENDPOINTS.AUTH.TOKEN);
  }

  /**
   * Busca todos os clientes (apenas funcionários)
   */
  async getClients(): Promise<ApiResponse<any[]>> {
    return this.get(API_ENDPOINTS.CLIENTS.BASE);
  }

  /**
   * Busca cliente por ID
   */
  async getClientById(id: string | number): Promise<ApiResponse<any>> {
    return this.get(API_ENDPOINTS.CLIENTS.BY_ID(id));
  }

  /**
   * Busca cliente por email (apenas funcionários)
   */
  async getClientByEmail(email: string): Promise<ApiResponse<any>> {
    // Buscar todos os clientes e filtrar por email
    const response = await this.getClients();
    if (response.success && response.data) {
      const cliente = response.data.find((c: any) => c.email === email);
      if (cliente) {
        return { success: true, data: cliente };
      }
      return { success: false, error: 'Cliente não encontrado' };
    }
    return response;
  }

  /**
   * Busca dados do cliente logado (apenas clientes)
   */
  async getMyClient(): Promise<ApiResponse<any>> {
    return this.get(API_ENDPOINTS.CLIENTS.ME);
  }

  /**
   * Cadastra novo cliente
   */
  async createClient(clientData: any): Promise<ApiResponse<any>> {
    return this.post(API_ENDPOINTS.CLIENTS.CADASTRO, clientData);
  }

  /**
   * Atualiza cliente
   */
  async updateClient(id: string | number, clientData: any): Promise<ApiResponse<any>> {
    return this.put(API_ENDPOINTS.CLIENTS.BY_ID(id), clientData);
  }

  /**
   * Remove cliente
   */
  async deleteClient(id: string | number): Promise<ApiResponse<any>> {
    return this.delete(API_ENDPOINTS.CLIENTS.BY_ID(id));
  }

  /**
   * Busca todos os funcionários
   */
  async getEmployees(): Promise<ApiResponse<any[]>> {
    return this.get(API_ENDPOINTS.EMPLOYEES.BASE);
  }

  /**
   * Busca funcionário por ID
   */
  async getEmployeeById(id: string | number): Promise<ApiResponse<any>> {
    return this.get(API_ENDPOINTS.EMPLOYEES.BY_ID(id));
  }

  /**
   * Cadastra novo funcionário
   */
  async createEmployee(employeeData: any): Promise<ApiResponse<any>> {
    return this.post(API_ENDPOINTS.EMPLOYEES.BASE, employeeData);
  }

  /**
   * Busca todos os pacotes
   */
  async getPackages(): Promise<ApiResponse<any[]>> {
    return this.get(API_ENDPOINTS.PACKAGES.BASE);
  }

  /**
   * Busca pacote por ID
   */
  async getPackageById(id: string | number): Promise<ApiResponse<any>> {
    return this.get(API_ENDPOINTS.PACKAGES.BY_ID(id));
  }

  /**
   * Cria novo pacote
   */
  async createPackage(packageData: any): Promise<ApiResponse<any>> {
    return this.post(API_ENDPOINTS.PACKAGES.BASE, packageData);
  }

  /**
   * Analisa acessibilidade de um site
   */
  async analyzeSiteAccessibility(url: string): Promise<ApiResponse<any>> {
    const endpoint = API_ENDPOINTS.LIGHTHOUSE.ANALYZE;
    console.log('[API] analyzeSiteAccessibility - Endpoint:', endpoint);
    console.log('[API] analyzeSiteAccessibility - Base URL:', API_CONFIG.baseURL);
    console.log('[API] analyzeSiteAccessibility - URL completa:', `${API_CONFIG.baseURL}${endpoint}`);
    return this.post(endpoint, { url });
  }

  /**
   * Busca todos os orçamentos
   */
  async getBudgets(): Promise<ApiResponse<any[]>> {
    return this.get(API_ENDPOINTS.BUDGETS.BASE);
  }

  /**
   * Cria novo orçamento
   */
  async createBudget(budgetData: any): Promise<ApiResponse<any>> {
    return this.post(API_ENDPOINTS.BUDGETS.BASE, budgetData);
  }

  /**
   * Busca todos os contratos
   */
  async getContracts(): Promise<ApiResponse<any[]>> {
    return this.get(API_ENDPOINTS.CONTRACTS.BASE);
  }

  /**
   * Cria novo contrato
   */
  async createContract(contractData: any): Promise<ApiResponse<any>> {
    return this.post(API_ENDPOINTS.CONTRACTS.BASE, contractData);
  }

  /**
   * Assina um contrato digitalmente
   */
  async signContract(contratoId: string, signatureBase64: string): Promise<ApiResponse<{ signedContractPath: string }>> {
    return this.post(API_ENDPOINTS.CONTRACTS.SIGN, {
      contrato_id: contratoId,
      signature: signatureBase64,
    });
  }

  /**
   * Busca todas as solicitações (apenas funcionários)
   */
  async getRequests(): Promise<ApiResponse<any[]>> {
    return this.get(API_ENDPOINTS.REQUESTS.BASE);
  }

  /**
   * Busca solicitações do cliente logado
   */
  async getMyRequests(): Promise<ApiResponse<any[]>> {
    return this.get(API_ENDPOINTS.REQUESTS.MY);
  }

  /**
   * Cria nova solicitação de orçamento (apenas clientes)
   */
  async createRequest(requestData: {
    site: string;
    tipo_pacote: 'A' | 'AA' | 'AAA';
    observacoes?: string;
    selected_issues?: any[];
  }): Promise<ApiResponse<any>> {
    return this.post(API_ENDPOINTS.REQUESTS.BASE, requestData);
  }

  /**
   * Busca uma solicitação por ID
   */
  async getRequest(id: string): Promise<ApiResponse<any>> {
    return this.get(API_ENDPOINTS.REQUESTS.BY_ID(id));
  }

  /**
   * Cria orçamento automaticamente a partir de uma solicitação
   */
  async createOrcamentoFromRequest(solicitacaoId: string, valorOrcamento?: number): Promise<ApiResponse<any>> {
    return this.post(API_ENDPOINTS.REQUESTS.CREATE_ORCAMENTO(solicitacaoId), {
      valor_orcamento: valorOrcamento,
    });
  }

  /**
   * Atualiza uma solicitação
   */
  async updateSolicitacao(solicitacaoId: string, data: { status?: string; observacoes?: string }): Promise<ApiResponse<any>> {
    return this.patch(API_ENDPOINTS.REQUESTS.UPDATE(solicitacaoId), data);
  }
}

// Exportar instância singleton
export default ApiService.getInstance();

