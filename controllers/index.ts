/**
 * Controllers Index - Ponto de entrada para todos os controladores
 * 
 * Este arquivo centraliza as exportações de todos os controladores,
 * facilitando a importação e manutenção do código.
 */

// Auth Controller
export { AuthController, type AuthState, type AuthAction } from './auth/AuthController';

// Image Controller
export { 
  ImageController, 
  type ImageControllerState, 
  type ImageUploadResult, 
  type ImageListResult 
} from './image/ImageController';

// Request Controller
export { RequestController, type RequestState, type RequestAction } from './request/RequestController';

// Evaluation Controller
export { 
  EvaluationController, 
  type EvaluationState, 
  type EvaluationAction 
} from './evaluation/EvaluationController';

// EXPANSÃO FUTURA:
// - Novos controladores podem ser adicionados aqui
// - Sistema de middleware centralizado
// - Interceptadores de requisições
// - Cache de controladores
// - Sistema de eventos globais


