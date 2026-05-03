/**
 * StorageAdapter - Interface abstrata para diferentes backends de storage
 * 
 * Responsabilidades:
 * - Definir interface comum para SQLite (mobile) e IndexedDB (web)
 * - Garantir compatibilidade entre plataformas
 * - Facilitar testes e manutenção
 */

export interface DatabaseResult {
  success: boolean;
  data?: any;
  error?: string;
}

export interface StorageAdapter {
  /**
   * Inicializa o storage
   */
  initialize(): Promise<DatabaseResult>;

  /**
   * Executa uma query e retorna múltiplas linhas
   */
  query(sql: string, params?: any[]): Promise<DatabaseResult>;

  /**
   * Executa uma operação (INSERT, UPDATE, DELETE)
   */
  execute(sql: string, params?: any[]): Promise<DatabaseResult>;

  /**
   * Retorna a primeira linha de uma query
   */
  getFirst(sql: string, params?: any[]): Promise<DatabaseResult>;

  /**
   * Executa uma transação
   */
  transaction(callback: () => Promise<void>): Promise<DatabaseResult>;

  /**
   * Fecha a conexão
   */
  close(): Promise<void>;

  /**
   * Verifica se está pronto
   */
  isReady(): boolean;
}



