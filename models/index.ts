/**
 * Models Index - Ponto de entrada para todos os modelos
 * 
 * Este arquivo centraliza as exportações de todos os modelos,
 * facilitando a importação e manutenção do código.
 */

// User Model
export { UserModel, type User, type LoginCredentials, type UserCreateData } from './user/UserModel';

// Image Model
export { 
  ImageModel, 
  type ImageData, 
  type ImageUploadData, 
  type ImageQueryOptions 
} from './image/ImageModel';

// Request Model
export { 
  RequestModel, 
  type AccessibilityRequest, 
  type RequestStatus,
  type DevelopmentStatus,
  type ChecklistItem, 
  type FileData,
  type StatusConfig 
} from './request/RequestModel';

// Evaluation Model
export { 
  EvaluationModel, 
  type EvaluationResult, 
  type EvaluationIssue, 
  type WCAGItem, 
  type AccessibilityPlan 
} from './evaluation/EvaluationModel';

// EXPANSÃO FUTURA:
// - Novos modelos podem ser adicionados aqui
// - Sistema de validação centralizado
// - Cache de modelos
// - Serialização/deserialização
