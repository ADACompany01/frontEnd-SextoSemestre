/**
 * IndexedDBAdapter - Adaptador de storage para navegadores web
 * 
 * Responsabilidades:
 * - Implementar StorageAdapter usando IndexedDB
 * - Emular SQL básico para compatibilidade com o código existente
 * - Armazenar imagens como blobs no navegador
 * - Manter sincronização de metadados
 */

import { StorageAdapter, DatabaseResult } from './StorageAdapter';

export class IndexedDBAdapter implements StorageAdapter {
  private db: IDBDatabase | null = null;
  private isInitialized = false;
  private readonly DB_NAME = 'ada_company_db';
  private readonly DB_VERSION = 1;

  async initialize(): Promise<DatabaseResult> {
    try {
      if (this.isInitialized && this.db) {
        return { success: true, data: 'Database already initialized' };
      }

      return new Promise((resolve, reject) => {
        const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

        request.onerror = () => {
          reject(new Error('Failed to open IndexedDB'));
        };

        request.onsuccess = (event) => {
          this.db = (event.target as IDBOpenDBRequest).result;
          this.isInitialized = true;
          console.log('IndexedDB initialized successfully');
          resolve({ success: true, data: 'Database initialized' });
        };

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;

          // Criar object stores (equivalente a tabelas)
          if (!db.objectStoreNames.contains('users')) {
            const userStore = db.createObjectStore('users', { keyPath: 'id', autoIncrement: true });
            userStore.createIndex('email', 'email', { unique: true });
            userStore.createIndex('type', 'type', { unique: false });
          }

          if (!db.objectStoreNames.contains('images')) {
            const imageStore = db.createObjectStore('images', { keyPath: 'id', autoIncrement: true });
            imageStore.createIndex('category', 'category', { unique: false });
            imageStore.createIndex('user_id', 'user_id', { unique: false });
            imageStore.createIndex('filename', 'filename', { unique: false });
          }

          if (!db.objectStoreNames.contains('image_blobs')) {
            // Store separado para os blobs das imagens
            db.createObjectStore('image_blobs', { keyPath: 'image_id' });
          }

          if (!db.objectStoreNames.contains('company_settings')) {
            const settingsStore = db.createObjectStore('company_settings', { keyPath: 'id', autoIncrement: true });
            settingsStore.createIndex('setting_key', 'setting_key', { unique: true });
          }

          // Inserir dados iniciais
          this.insertInitialData(db);
        };
      });
    } catch (error) {
      console.error('IndexedDB initialization error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private insertInitialData(db: IDBDatabase): void {
    try {
      const transaction = db.transaction(['users', 'company_settings'], 'readwrite');
      
      // Dados iniciais removidos por segurança
      // As credenciais de teste estão documentadas no README.md
      
      // IMPORTANTE: Remover usuários de teste antigos que possam estar no banco
      // Isso garante que dados mock não persistam após a remoção do código
      const userStore = transaction.objectStore('users');
      const testEmails = ['client@example.com', 'employee@example.com'];
      
      // IndexedDB não suporta DELETE direto com WHERE, então precisamos buscar e deletar
      testEmails.forEach((email) => {
        const index = userStore.index('email');
        const request = index.get(email);
        request.onsuccess = () => {
          if (request.result) {
            userStore.delete(request.result.id);
          }
        };
      });

      // Inserir configurações
      const settingsStore = transaction.objectStore('company_settings');
      settingsStore.add({
        setting_key: 'company_name',
        setting_value: 'ADA Company',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      settingsStore.add({
        setting_key: 'company_logo_path',
        setting_value: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      settingsStore.add({
        setting_key: 'app_version',
        setting_value: '1.0.0',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error inserting initial data:', error);
    }
  }

  async query(sql: string, params: any[] = []): Promise<DatabaseResult> {
    try {
      if (!this.db) {
        throw new Error('Database not initialized');
      }

      // Parse SQL simples para IndexedDB
      const result = await this.parseAndExecuteSQL(sql, params);
      return { success: true, data: result };
    } catch (error) {
      console.error('Query error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async execute(sql: string, params: any[] = []): Promise<DatabaseResult> {
    try {
      if (!this.db) {
        throw new Error('Database not initialized');
      }

      const result = await this.parseAndExecuteSQL(sql, params);
      return { success: true, data: result };
    } catch (error) {
      console.error('Execute error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getFirst(sql: string, params: any[] = []): Promise<DatabaseResult> {
    try {
      if (!this.db) {
        throw new Error('Database not initialized');
      }

      const result = await this.parseAndExecuteSQL(sql, params);
      const firstResult = Array.isArray(result) && result.length > 0 ? result[0] : null;
      return { success: true, data: firstResult };
    } catch (error) {
      console.error('GetFirst error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async transaction(callback: () => Promise<void>): Promise<DatabaseResult> {
    try {
      if (!this.db) {
        throw new Error('Database not initialized');
      }

      await callback();
      return { success: true };
    } catch (error) {
      console.error('Transaction error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.isInitialized = false;
    }
  }

  isReady(): boolean {
    return this.isInitialized && this.db !== null;
  }

  /**
   * Parser SQL simples para IndexedDB
   * Suporta operações básicas: SELECT, INSERT, UPDATE, DELETE
   */
  private async parseAndExecuteSQL(sql: string, params: any[] = []): Promise<any> {
    const normalizedSQL = sql.trim().toUpperCase();

    // SELECT
    if (normalizedSQL.startsWith('SELECT')) {
      return this.handleSelect(sql, params);
    }

    // INSERT
    if (normalizedSQL.startsWith('INSERT')) {
      return this.handleInsert(sql, params);
    }

    // UPDATE
    if (normalizedSQL.startsWith('UPDATE')) {
      return this.handleUpdate(sql, params);
    }

    // DELETE
    if (normalizedSQL.startsWith('DELETE')) {
      return this.handleDelete(sql, params);
    }

    throw new Error('Unsupported SQL operation');
  }

  private async handleSelect(sql: string, params: any[]): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');

    // Extrair nome da tabela
    const tableMatch = sql.match(/FROM\s+(\w+)/i);
    if (!tableMatch) throw new Error('Invalid SELECT query');

    const tableName = tableMatch[1];
    const store = this.db.transaction([tableName], 'readonly').objectStore(tableName);

    // WHERE clause
    const whereMatch = sql.match(/WHERE\s+(.+?)(?:ORDER|LIMIT|GROUP|$)/i);
    
    return new Promise((resolve, reject) => {
      const results: any[] = [];
      const request = store.openCursor();

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          const value = cursor.value;
          
          // Aplicar filtro WHERE se houver
          if (whereMatch) {
            const whereClause = whereMatch[1].trim();
            if (this.matchesWhereClause(value, whereClause, params)) {
              results.push(value);
            }
          } else {
            results.push(value);
          }
          
          cursor.continue();
        } else {
          // Aplicar ORDER BY se houver
          const orderMatch = sql.match(/ORDER BY\s+(\w+)\s*(ASC|DESC)?/i);
          if (orderMatch) {
            const orderField = orderMatch[1];
            const orderDirection = orderMatch[2]?.toUpperCase() === 'ASC' ? 1 : -1;
            results.sort((a, b) => {
              if (a[orderField] < b[orderField]) return -1 * orderDirection;
              if (a[orderField] > b[orderField]) return 1 * orderDirection;
              return 0;
            });
          }

          // Aplicar LIMIT se houver
          const limitMatch = sql.match(/LIMIT\s+(\d+)/i);
          if (limitMatch) {
            const limit = parseInt(limitMatch[1]);
            resolve(results.slice(0, limit));
          } else {
            resolve(results);
          }
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  private matchesWhereClause(value: any, whereClause: string, params: any[]): boolean {
    // Substitui ? pelos parâmetros
    let clause = whereClause;
    let paramIndex = 0;
    clause = clause.replace(/\?/g, () => {
      const param = params[paramIndex++];
      return typeof param === 'string' ? `'${param}'` : String(param);
    });

    // Suporte para múltiplas condições com AND
    if (clause.toUpperCase().includes(' AND ')) {
      const conditions = clause.split(/\s+AND\s+/i);
      return conditions.every(condition => this.evaluateCondition(value, condition.trim()));
    }

    // Suporte para múltiplas condições com OR
    if (clause.toUpperCase().includes(' OR ')) {
      const conditions = clause.split(/\s+OR\s+/i);
      return conditions.some(condition => this.evaluateCondition(value, condition.trim()));
    }

    // Condição simples
    return this.evaluateCondition(value, clause);
  }

  private evaluateCondition(value: any, condition: string): boolean {
    // Remove espaços extras
    condition = condition.trim();

    // Parse: campo = valor
    if (condition.includes('=')) {
      const [field, valueStr] = condition.split('=').map(s => s.trim());
      const fieldValue = value[field];
      const expectedValue = valueStr.replace(/['"]/g, '');
      
      if (expectedValue === 'NULL' || expectedValue === 'null') {
        return fieldValue === null || fieldValue === undefined;
      }
      
      return String(fieldValue) === expectedValue;
    }

    // Parse: campo != valor
    if (condition.includes('!=') || condition.includes('<>')) {
      const parts = condition.split(/!=|<>/).map(s => s.trim());
      const field = parts[0];
      const valueStr = parts[1];
      const fieldValue = value[field];
      const expectedValue = valueStr.replace(/['"]/g, '');
      
      return String(fieldValue) !== expectedValue;
    }

    // Parse: campo LIKE valor
    if (condition.toUpperCase().includes(' LIKE ')) {
      const parts = condition.split(/\s+LIKE\s+/i);
      const field = parts[0].trim();
      const pattern = parts[1].trim().replace(/['"]/g, '').replace(/%/g, '.*');
      const fieldValue = String(value[field] || '');
      return new RegExp(pattern, 'i').test(fieldValue);
    }

    // Parse: campo IN (...)
    if (condition.toUpperCase().includes(' IN ')) {
      const parts = condition.split(/\s+IN\s+/i);
      const field = parts[0].trim();
      const valuesStr = parts[1].trim().replace(/[()]/g, '');
      const values = valuesStr.split(',').map(v => v.trim().replace(/['"]/g, ''));
      const fieldValue = String(value[field]);
      return values.includes(fieldValue);
    }

    // Default: aceita tudo se não conseguir parsear
    return true;
  }

  private async handleInsert(sql: string, params: any[]): Promise<any> {
    if (!this.db) throw new Error('Database not initialized');

    // Extrair nome da tabela
    const tableMatch = sql.match(/INTO\s+(\w+)/i);
    if (!tableMatch) throw new Error('Invalid INSERT query');

    const tableName = tableMatch[1];

    // Extrair campos
    const fieldsMatch = sql.match(/\(([^)]+)\)/);
    if (!fieldsMatch) throw new Error('Invalid INSERT query - no fields');

    const fields = fieldsMatch[1].split(',').map(f => f.trim());

    // Criar objeto com os valores
    const data: any = {
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    fields.forEach((field, index) => {
      data[field] = params[index];
    });

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([tableName], 'readwrite');
      const store = transaction.objectStore(tableName);
      const request = store.add(data);

      request.onsuccess = () => {
        resolve({ lastInsertRowId: request.result });
      };

      request.onerror = () => reject(request.error);
    });
  }

  private async handleUpdate(sql: string, params: any[]): Promise<any> {
    if (!this.db) throw new Error('Database not initialized');

    // Extrair nome da tabela
    const tableMatch = sql.match(/UPDATE\s+(\w+)/i);
    if (!tableMatch) throw new Error('Invalid UPDATE query');

    const tableName = tableMatch[1];

    // Extrair WHERE
    const whereMatch = sql.match(/WHERE\s+(.+)$/i);
    if (!whereMatch) throw new Error('UPDATE requires WHERE clause');

    const whereClause = whereMatch[1];

    // Extrair campos SET
    const setMatch = sql.match(/SET\s+(.+?)\s+WHERE/i);
    if (!setMatch) throw new Error('Invalid UPDATE query');

    const setClause = setMatch[1];
    const setPairs = setClause.split(',').map(s => s.trim());

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([tableName], 'readwrite');
      const store = transaction.objectStore(tableName);
      const request = store.openCursor();
      let updateCount = 0;

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          const value = cursor.value;
          
          if (this.matchesWhereClause(value, whereClause, params.slice(setPairs.length))) {
            // Aplicar updates
            let paramIndex = 0;
            setPairs.forEach(pair => {
              const [field] = pair.split('=').map(s => s.trim());
              if (field !== 'updated_at') {
                value[field] = params[paramIndex++];
              }
            });
            value.updated_at = new Date().toISOString();
            
            cursor.update(value);
            updateCount++;
          }
          
          cursor.continue();
        } else {
          resolve({ changes: updateCount });
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  private async handleDelete(sql: string, params: any[]): Promise<any> {
    if (!this.db) throw new Error('Database not initialized');

    // Extrair nome da tabela
    const tableMatch = sql.match(/FROM\s+(\w+)/i);
    if (!tableMatch) throw new Error('Invalid DELETE query');

    const tableName = tableMatch[1];

    // Extrair WHERE
    const whereMatch = sql.match(/WHERE\s+(.+)$/i);
    if (!whereMatch) throw new Error('DELETE requires WHERE clause');

    const whereClause = whereMatch[1];

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([tableName], 'readwrite');
      const store = transaction.objectStore(tableName);
      const request = store.openCursor();
      let deleteCount = 0;

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          if (this.matchesWhereClause(cursor.value, whereClause, params)) {
            cursor.delete();
            deleteCount++;
          }
          cursor.continue();
        } else {
          resolve({ changes: deleteCount });
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Salva um blob de imagem no IndexedDB
   */
  async saveImageBlob(imageId: number, blob: Blob): Promise<DatabaseResult> {
    try {
      if (!this.db) throw new Error('Database not initialized');

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction(['image_blobs'], 'readwrite');
        const store = transaction.objectStore('image_blobs');
        const request = store.put({ image_id: imageId, blob });

        request.onsuccess = () => {
          resolve({ success: true });
        };

        request.onerror = () => {
          reject(request.error);
        };
      });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Recupera um blob de imagem do IndexedDB
   */
  async getImageBlob(imageId: number): Promise<DatabaseResult> {
    try {
      if (!this.db) throw new Error('Database not initialized');

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction(['image_blobs'], 'readonly');
        const store = transaction.objectStore('image_blobs');
        const request = store.get(imageId);

        request.onsuccess = () => {
          resolve({ success: true, data: request.result?.blob });
        };

        request.onerror = () => {
          reject(request.error);
        };
      });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

