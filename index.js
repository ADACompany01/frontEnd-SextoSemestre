/**
 * Index - Ponto de entrada para React Native/Expo
 * 
 * Este arquivo inicializa a aplicação React Native com Expo.
 */

import { registerRootComponent } from 'expo';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import App from './App';

function RootApp() {
  return (
    <SafeAreaProvider>
      <App />
    </SafeAreaProvider>
  );
}

// Register the main component
registerRootComponent(RootApp);
