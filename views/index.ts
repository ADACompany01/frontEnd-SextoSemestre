/**
 * Views Index - Ponto de entrada para todas as views React Native
 * 
 * Este arquivo centraliza as exportações de todas as views para React Native,
 * facilitando a importação e manutenção do código.
 */

// Components
export { StarRating } from './components/StarRating.native';
export { CircularProgress } from './components/CircularProgress.native';
export { Timeline } from './components/Timeline.native';
export * from './components/Icons.native';

// Screens
export { LoginScreen } from './screens/LoginScreen.native';
export { RegisterScreen } from './screens/RegisterScreen.native';
export { ClientDashboard } from './screens/ClientDashboard.native';
export { EmployeeDashboard } from './screens/EmployeeDashboard.native';
export { EvaluationScreen } from './screens/EvaluationScreen.native';
export { PlanSelectionScreen } from './screens/PlanSelectionScreen.native';
export { SignatureScreen } from './screens/SignatureScreen.native';

// EXPANSÃO FUTURA:
// - Novas telas podem ser adicionadas aqui
// - Sistema de roteamento com React Navigation
// - Guards de autenticação
// - Lazy loading de componentes
