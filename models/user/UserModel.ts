/**
 * UserModel - Modelo de dados para usuários
 * 
 * Responsabilidades:
 * - Gerenciar dados de usuários (clientes e funcionários)
 * - Validar tipos de usuário
 * - Operações CRUD com API do backend (com fallback para SQLite)
 * - Regras de negócio relacionadas a usuários
 */

import { DatabaseService } from '../../services/DatabaseService';
import ApiService from '../../services/ApiService';

export interface User {
  id?: number;
  type: 'client' | 'employee';
  name: string;
  email: string;
  photo?: string;
  photo_path?: string;
  created_at?: string;
  updated_at?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface UserCreateData {
  type: 'client' | 'employee';
  name: string;
  email: string;
  password: string;
  photo_path?: string;
}

export class UserModel {
  private static db = DatabaseService.getInstance();
  private static api = ApiService;
  private static USE_API = true; // Flag para controlar uso da API

  /**
   * Valida credenciais de login
   * @param credentials - Email e senha do usuário
   * @returns Usuário se válido, null se inválido
   */
  static async validateLogin(credentials: LoginCredentials): Promise<{ success: boolean; data?: User; error?: string }> {
    try {
      const { email, password } = credentials;
      
      // Validação básica
      if (!email || !password) {
        return { success: false, error: 'Email e senha são obrigatórios' };
      }

      // Tentar usar a API primeiro
      if (this.USE_API) {
        try {
          console.log('[UserModel] Tentando login via API...');
          const apiResponse = await this.api.login(email, password);
          
          if (apiResponse.success && apiResponse.data) {
            const userData = apiResponse.data.user;
            
            // Mapear campos do backend (português) para frontend (inglês)
            const user: User = {
              id: userData.id,
              type: userData.tipo === 'cliente' ? 'client' : 'employee',
              name: userData.nome || userData.nome_razao_social || 'Usuário',
              email: userData.email,
              photo_path: userData.foto,
              photo: userData.foto
            };

            console.log('[UserModel] Login via API bem-sucedido!');
            console.log('[UserModel] Usuário:', user);
            return { success: true, data: user };
          } else {
            // API retornou erro, fazer fallback para banco local
            console.warn('[UserModel] API retornou erro, tentando banco local...', apiResponse.error);
          }
        } catch (apiError) {
          console.warn('[UserModel] Falha na API, tentando banco local...', apiError);
        }
      }

      // Fallback para SQLite local
      console.log('[UserModel] Usando SQLite local...');
      const result = await this.db.getFirst(`
        SELECT id, type, name, email, photo_path FROM users 
        WHERE email = ? AND password = ?
      `, [email, password]);

      if (!result.success) {
        return { success: false, error: result.error };
      }

      if (!result.data) {
        return { success: false, error: 'Credenciais inválidas' };
      }

      const user: User = {
        id: result.data.id,
        type: result.data.type,
        name: result.data.name,
        email: result.data.email,
        photo_path: result.data.photo_path,
        photo: result.data.photo_path
      };

      return { success: true, data: user };
    } catch (error) {
      console.error('[UserModel] Error validating login:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Busca usuário por email
   * @param email - Email do usuário
   * @returns Usuário se encontrado, null se não encontrado
   */
  static async getUserByEmail(email: string): Promise<{ success: boolean; data?: User; error?: string }> {
    try {
      // Tentar usar a API primeiro
      if (this.USE_API) {
        try {
          // Note: A API do backend não tem endpoint específico para buscar por email
          // então usamos o fallback local ou podemos implementar no backend depois
          console.log('[UserModel] Buscando usuário por email via SQLite (API não implementada)');
        } catch (apiError) {
          console.warn('[UserModel] Falha na API, usando SQLite local...', apiError);
        }
      }

      // Usar SQLite local
      const result = await this.db.getFirst(`
        SELECT id, type, name, email, photo_path FROM users WHERE email = ?
      `, [email]);

      if (!result.success) {
        return { success: false, error: result.error };
      }

      if (!result.data) {
        return { success: false, error: 'Usuário não encontrado' };
      }

      const user: User = {
        id: result.data.id,
        type: result.data.type,
        name: result.data.name,
        email: result.data.email,
        photo_path: result.data.photo_path,
        photo: result.data.photo_path
      };

      return { success: true, data: user };
    } catch (error) {
      console.error('[UserModel] Error getting user by email:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Verifica se usuário é cliente
   * @param user - Objeto usuário
   * @returns true se for cliente, false caso contrário
   */
  static isClient(user: User): boolean {
    return user.type === 'client';
  }

  /**
   * Verifica se usuário é funcionário
   * @param user - Objeto usuário
   * @returns true se for funcionário, false caso contrário
   */
  static isEmployee(user: User): boolean {
    return user.type === 'employee';
  }

  /**
   * Cria um novo usuário
   * @param userData - Dados do usuário
   * @returns Usuário criado
   */
  static async createUser(userData: UserCreateData): Promise<{ success: boolean; data?: User; error?: string }> {
    try {
      const validation = this.validateUserData(userData);
      if (!validation.isValid) {
        return { success: false, error: validation.errors.join(', ') };
      }

      const result = await this.db.execute(`
        INSERT INTO users (type, name, email, password, photo_path)
        VALUES (?, ?, ?, ?, ?)
      `, [
        userData.type,
        userData.name,
        userData.email,
        userData.password,
        userData.photo_path || null
      ]);

      if (!result.success) {
        return { success: false, error: result.error };
      }

      // Buscar o usuário recém-criado
      const newUser = await this.getUserById(result.data.lastInsertRowId);
      return { success: true, data: newUser.data };
    } catch (error) {
      console.error('Error creating user:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Busca usuário por ID
   * @param id - ID do usuário
   * @returns Usuário se encontrado
   */
  static async getUserById(id: number): Promise<{ success: boolean; data?: User; error?: string }> {
    try {
      const result = await this.db.getFirst(`
        SELECT id, type, name, email, photo_path, created_at, updated_at FROM users WHERE id = ?
      `, [id]);

      if (!result.success) {
        return { success: false, error: result.error };
      }

      if (!result.data) {
        return { success: false, error: 'Usuário não encontrado' };
      }

      const user: User = {
        id: result.data.id,
        type: result.data.type,
        name: result.data.name,
        email: result.data.email,
        photo_path: result.data.photo_path,
        photo: result.data.photo_path, // Para compatibilidade
        created_at: result.data.created_at,
        updated_at: result.data.updated_at
      };

      return { success: true, data: user };
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Atualiza dados do usuário
   * @param id - ID do usuário
   * @param userData - Dados para atualizar
   * @returns Usuário atualizado
   */
  static async updateUser(id: number, userData: Partial<UserCreateData>): Promise<{ success: boolean; data?: User; error?: string }> {
    try {
      const fields: string[] = [];
      const params: any[] = [];

      if (userData.name) {
        fields.push('name = ?');
        params.push(userData.name);
      }

      if (userData.email) {
        fields.push('email = ?');
        params.push(userData.email);
      }

      if (userData.password) {
        fields.push('password = ?');
        params.push(userData.password);
      }

      if (userData.photo_path !== undefined) {
        fields.push('photo_path = ?');
        params.push(userData.photo_path);
      }

      if (fields.length === 0) {
        return { success: false, error: 'Nenhum campo para atualizar' };
      }

      fields.push('updated_at = CURRENT_TIMESTAMP');
      params.push(id);

      const result = await this.db.execute(`
        UPDATE users SET ${fields.join(', ')} WHERE id = ?
      `, params);

      if (!result.success) {
        return { success: false, error: result.error };
      }

      // Buscar o usuário atualizado
      const updatedUser = await this.getUserById(id);
      return { success: true, data: updatedUser.data };
    } catch (error) {
      console.error('Error updating user:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Remove um usuário
   * @param id - ID do usuário
   * @returns Resultado da operação
   */
  static async deleteUser(id: number): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await this.db.execute(`
        DELETE FROM users WHERE id = ?
      `, [id]);

      if (!result.success) {
        return { success: false, error: result.error };
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting user:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Busca todos os usuários
   * @returns Lista de usuários
   */
  static async getAllUsers(): Promise<{ success: boolean; data?: User[]; error?: string }> {
    try {
      const result = await this.db.query(`
        SELECT id, type, name, email, photo_path, created_at, updated_at FROM users 
        ORDER BY created_at DESC
      `);

      if (!result.success) {
        return { success: false, error: result.error };
      }

      const users: User[] = (result.data || []).map((row: any) => ({
        id: row.id,
        type: row.type,
        name: row.name,
        email: row.email,
        photo_path: row.photo_path,
        photo: row.photo_path, // Para compatibilidade
        created_at: row.created_at,
        updated_at: row.updated_at
      }));

      return { success: true, data: users };
    } catch (error) {
      console.error('Error getting all users:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Valida dados de usuário
   * @param user - Objeto usuário
   * @returns true se válido, false se inválido
   */
  static validateUser(user: User): boolean {
    return !!(
      user &&
      user.name &&
      user.email &&
      (user.type === 'client' || user.type === 'employee')
    );
  }

  /**
   * Valida dados para criação de usuário
   * @param userData - Dados do usuário
   * @returns Resultado da validação
   */
  static validateUserData(userData: UserCreateData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!userData.name || userData.name.trim() === '') {
      errors.push('Nome é obrigatório');
    }

    if (!userData.email || userData.email.trim() === '') {
      errors.push('Email é obrigatório');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
      errors.push('Email inválido');
    }

    if (!userData.password || userData.password.trim() === '') {
      errors.push('Senha é obrigatória');
    } else if (userData.password.length < 6) {
      errors.push('Senha deve ter pelo menos 6 caracteres');
    }

    if (!userData.type || !['client', 'employee'].includes(userData.type)) {
      errors.push('Tipo de usuário inválido');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Define se deve usar API ou SQLite
   */
  static setUseApi(useApi: boolean): void {
    this.USE_API = useApi;
    console.log(`[UserModel] Modo de operação: ${useApi ? 'API' : 'SQLite local'}`);
  }

  /**
   * Verifica se está usando API
   */
  static isUsingApi(): boolean {
    return this.USE_API;
  }
}

// EXPANSÃO FUTURA:
// - Integração completa com todos os endpoints da API
// - Sistema de permissões e roles
// - Gestão de sessões
// - Recuperação de senha
// - Validação de email
// - Upload de fotos de perfil


