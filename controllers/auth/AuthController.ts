/**
 * AuthController - Controlador de autenticação
 * 
 * Responsabilidades:
 * - Gerenciar fluxo de login/logout
 * - Validar credenciais
 * - Manter estado da sessão
 * - Integrar com UserModel
 */

import { UserModel, type User, type LoginCredentials } from '../../models';
import { ImageController } from '../image/ImageController';

export interface AuthState {
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export type AuthAction = 
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; user: User }
  | { type: 'LOGIN_ERROR'; error: string }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' };

export class AuthController {
  private static instance: AuthController;
  private authState: AuthState = {
    currentUser: null,
    isAuthenticated: false,
    isLoading: false,
    error: null
  };
  private listeners: Array<(state: AuthState) => void> = [];
  private imageController: ImageController;

  /**
   * Singleton pattern para garantir uma única instância
   */
  static getInstance(): AuthController {
    if (!AuthController.instance) {
      AuthController.instance = new AuthController();
    }
    return AuthController.instance;
  }

  private constructor() {
    this.imageController = ImageController.getInstance();
  }

  /**
   * Subscriber pattern para notificar mudanças de estado
   */
  subscribe(listener: (state: AuthState) => void): () => void {
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
    this.listeners.forEach(listener => listener(this.authState));
  }

  /**
   * Reducer para gerenciar mudanças de estado
   */
  dispatch(action: AuthAction): void {
    switch (action.type) {
      case 'LOGIN_START':
        this.authState = {
          ...this.authState,
          isLoading: true,
          error: null
        };
        break;
      
      case 'LOGIN_SUCCESS':
        this.authState = {
          currentUser: action.user,
          isAuthenticated: true,
          isLoading: false,
          error: null
        };
        break;
      
      case 'LOGIN_ERROR':
        this.authState = {
          ...this.authState,
          isLoading: false,
          error: action.error
        };
        break;
      
      case 'LOGOUT':
        this.authState = {
          currentUser: null,
          isAuthenticated: false,
          isLoading: false,
          error: null
        };
        break;
      
      case 'CLEAR_ERROR':
        this.authState = {
          ...this.authState,
          error: null
        };
        break;
    }
    
    this.notifyListeners();
  }

  /**
   * Realiza login do usuário
   * @param credentials - Credenciais de login
   * @returns Promise que resolve com o usuário ou rejeita com erro
   */
  async login(credentials: LoginCredentials): Promise<User> {
    this.dispatch({ type: 'LOGIN_START' });

    try {
      // Valida credenciais usando o modelo
      const result = await UserModel.validateLogin(credentials);
      
      if (!result.success || !result.data) {
        const error = result.error || 'Usuário não encontrado. Tente client@example.com ou employee@example.com';
        this.dispatch({ type: 'LOGIN_ERROR', error });
        throw new Error(error);
      }

      // Login bem-sucedido
      this.dispatch({ type: 'LOGIN_SUCCESS', user: result.data });

      // Sincronizar foto de perfil em background (não bloqueia o login)
      // TEMPORARIAMENTE DESABILITADO PARA DEBUG
      // if (result.data.id) {
      //   this.syncUserPhotoInBackground(result.data.id);
      // }

      return result.data;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      this.dispatch({ type: 'LOGIN_ERROR', error: errorMessage });
      throw error;
    }
  }

  /**
   * Sincroniza foto de perfil em background após login
   */
  private async syncUserPhotoInBackground(userId: number): Promise<void> {
    try {
      console.log(`[AuthController] Iniciando sincronização de foto para usuário ${userId}`);
      
      // Aguardar um pouco para não bloquear o login
      setTimeout(async () => {
        try {
          const syncResult = await this.imageController.syncUserPhoto(userId);
          
          if (syncResult.success) {
            console.log(`[AuthController] Foto sincronizada com sucesso para usuário ${userId}`);
          } else {
            console.warn(`[AuthController] Falha na sincronização de foto: ${syncResult.error}`);
          }
        } catch (syncError) {
          console.warn(`[AuthController] Erro na sincronização de foto:`, syncError);
        }
      }, 1000); // Aguarda 1 segundo antes de sincronizar

    } catch (error) {
      console.warn(`[AuthController] Erro ao iniciar sincronização de foto:`, error);
    }
  }

  /**
   * Realiza logout do usuário
   */
  logout(): void {
    this.dispatch({ type: 'LOGOUT' });
  }

  /**
   * Obtém estado atual da autenticação
   */
  getAuthState(): AuthState {
    return { ...this.authState };
  }

  /**
   * Obtém usuário atual
   */
  getCurrentUser(): User | null {
    return this.authState.currentUser;
  }

  /**
   * Verifica se usuário está autenticado
   */
  isAuthenticated(): boolean {
    return this.authState.isAuthenticated;
  }

  /**
   * Verifica se usuário é cliente
   */
  isClient(): boolean {
    return this.authState.currentUser ? UserModel.isClient(this.authState.currentUser) : false;
  }

  /**
   * Verifica se usuário é funcionário
   */
  isEmployee(): boolean {
    return this.authState.currentUser ? UserModel.isEmployee(this.authState.currentUser) : false;
  }

  /**
   * Limpa mensagens de erro
   */
  clearError(): void {
    this.dispatch({ type: 'CLEAR_ERROR' });
  }

  /**
   * Obtém mensagem de erro atual
   */
  getError(): string | null {
    return this.authState.error;
  }

  /**
   * Verifica se está carregando
   */
  isLoading(): boolean {
    return this.authState.isLoading;
  }

  /**
   * Define usuário como logado (usado após registro bem-sucedido)
   */
  setAuthenticatedUser(user: User): void {
    this.dispatch({ type: 'LOGIN_SUCCESS', user });
  }

  /**
   * Valida se as credenciais estão no formato correto
   * @param credentials - Credenciais a serem validadas
   * @returns true se válidas, false caso contrário
   */
  static validateCredentials(credentials: LoginCredentials): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return !!(
      credentials.email && 
      credentials.password && 
      emailRegex.test(credentials.email) &&
      credentials.password.length >= 1
    );
  }

  /**
   * Formata email para exibição
   * @param email - Email a ser formatado
   * @returns Email formatado ou string vazia
   */
  static formatEmail(email: string): string {
    return email.toLowerCase().trim();
  }
}

// EXPANSÃO FUTURA:
// - Integração com JWT tokens
// - Refresh tokens
// - Lembrar usuário
// - Recuperação de senha
// - Autenticação de dois fatores
// - Integração com OAuth (Google, Facebook, etc.)
// - Rate limiting para tentativas de login
// - Logs de auditoria


