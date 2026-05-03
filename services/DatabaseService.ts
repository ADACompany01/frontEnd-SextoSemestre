/**
 * DatabaseService - Serviço de banco de dados cross-platform
 * 
 * Responsabilidades:
 * - Configuração e inicialização do banco de dados
 * - Abstração entre SQLite (mobile) e IndexedDB (web)
 * - Operações básicas de banco de dados
 * - Gerenciamento de conexões
 */

import { Platform } from 'react-native';
import { StorageAdapter, DatabaseResult } from './storage/StorageAdapter';
import { SQLiteAdapter } from './storage/SQLiteAdapter';
import { IndexedDBAdapter } from './storage/IndexedDBAdapter';

export { DatabaseResult };

export class DatabaseService {
  private static instance: DatabaseService;
  private adapter: StorageAdapter;

  private constructor() {
    // Seleciona o adapter correto baseado na plataforma
    if (Platform.OS === 'web') {
      console.log('Usando IndexedDB para web');
      this.adapter = new IndexedDBAdapter();
    } else {
      console.log('Usando SQLite para mobile');
      this.adapter = new SQLiteAdapter();
    }
  }

  /**
   * Singleton pattern para garantir uma única instância
   */
  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  /**
   * Inicializa o banco de dados e cria as tabelas necessárias
   */
  async initialize(): Promise<DatabaseResult> {
    return this.adapter.initialize();
  }

  /**
   * Executa uma query SQL
   */
  async query(sql: string, params: any[] = []): Promise<DatabaseResult> {
    return this.adapter.query(sql, params);
  }

  /**
   * Executa uma operação de inserção/atualização/exclusão
   */
  async execute(sql: string, params: any[] = []): Promise<DatabaseResult> {
    return this.adapter.execute(sql, params);
  }

  /**
   * Obtém uma única linha de resultado
   */
  async getFirst(sql: string, params: any[] = []): Promise<DatabaseResult> {
    return this.adapter.getFirst(sql, params);
  }

  /**
   * Inicia uma transação
   */
  async transaction(callback: () => Promise<void>): Promise<DatabaseResult> {
    return this.adapter.transaction(callback);
  }

  /**
   * Fecha a conexão com o banco
   */
  async close(): Promise<void> {
    return this.adapter.close();
  }

  /**
   * Verifica se o banco está inicializado
   */
  isReady(): boolean {
    return this.adapter.isReady();
  }
}

// EXPANSÃO FUTURA:
// - Migrations automáticas
// - Backup e restore
// - Índices para performance
// - Cache de queries
// - Logging de operações
// - Validação de schema

