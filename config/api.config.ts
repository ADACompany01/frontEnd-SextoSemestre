/**
 * Configuração da API
 * 
 * Centraliza as configurações de conexão com o backend
 * 
 * ✅ DETECÇÃO AUTOMÁTICA: Não precisa mais configurar IP manualmente!
 * 
 * Como funciona:
 * - Web: usa localhost automaticamente
 * - Mobile: detecta IP automaticamente ou usa duckdns.org
 * - Você pode sobrescrever usando variável de ambiente EXPO_PUBLIC_API_URL
 */

import { getApiBaseUrl } from '../utils/getApiUrl';

// URL base da API - detectada automaticamente
// Prioridade:
// 1. Variável de ambiente EXPO_PUBLIC_API_URL (se definida)
// 2. Web: localhost:3000
// 3. Mobile dev: IP do Expo ou duckdns.org
// 4. Produção: duckdns.org
export const API_BASE_URL = getApiBaseUrl();

// Timeout para requisições (em milissegundos)
export const API_TIMEOUT = 120000; // 120 segundos (2 minutos) - Lighthouse pode demorar

// Headers padrão
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

// Configurações específicas por ambiente
export const API_CONFIG = {
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: DEFAULT_HEADERS,
};

// Endpoints da API
export const API_ENDPOINTS = {
  // Autenticação
  AUTH: {
    LOGIN: '/auth/login',
    TOKEN: '/auth/token',
  },
  
  // Clientes
  CLIENTS: {
    BASE: '/clientes',
    BY_ID: (id: string | number) => `/clientes/${id}`,
    CADASTRO: '/clientes/cadastro',
    ME: '/clientes/me',
  },
  
  // Funcionários
  EMPLOYEES: {
    BASE: '/funcionarios',
    BY_ID: (id: string | number) => `/funcionarios/${id}`,
  },
  
  // Pacotes
  PACKAGES: {
    BASE: '/pacotes',
    BY_ID: (id: string | number) => `/pacotes/${id}`,
  },
  
  // Orçamentos
  BUDGETS: {
    BASE: '/orcamentos',
    BY_ID: (id: string | number) => `/orcamentos/${id}`,
  },
  
  // Contratos
  CONTRACTS: {
    BASE: '/contratos',
    BY_ID: (id: string | number) => `/contratos/${id}`,
    SIGN: '/contratos/sign',
  },
  
  // Solicitações
  REQUESTS: {
    BASE: '/solicitacoes',
    BY_ID: (id: string | number) => `/solicitacoes/${id}`,
    MY: '/solicitacoes/minhas',
    CREATE_ORCAMENTO: (id: string | number) => `/solicitacoes/${id}/criar-orcamento`,
    UPDATE: (id: string | number) => `/solicitacoes/${id}`,
  },
  
  // Lighthouse (avaliação de acessibilidade)
  // Nota: O LighthouseController usa o prefixo 'mobile/lighthouse'
  LIGHTHOUSE: {
    ANALYZE: '/mobile/lighthouse/analyze',
  },
  
  // Logs
  LOGS: {
    BASE: '/logs',
    STATS: '/logs/stats',
    OLD: '/logs/old',
  },
};

// Status HTTP
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
};

