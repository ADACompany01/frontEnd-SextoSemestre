/**
 * Utilitário para detectar automaticamente a URL da API
 * ✅ Funciona em qualquer máquina sem precisar configurar IP manualmente!
 * 
 * Estratégias (em ordem de prioridade):
 * 1. Variável de ambiente EXPO_PUBLIC_API_URL (se definida)
 * 2. Web: sempre usa localhost
 * 3. Mobile: tenta detectar IP do Expo ou usa duckdns.org
 * 4. Fallback para duckdns.org (funciona em qualquer rede se configurado)
 */

import { Platform } from 'react-native';

/**
 * Obtém o IP local do Expo quando disponível
 */
const getExpoIP = (): string | null => {
  try {
    // Tenta usar expo-constants se disponível
    // @ts-ignore - expo-constants pode não estar tipado
    const Constants = require('expo-constants').default;
    if (Constants) {
      // Expo fornece o IP na constante debuggerHost
      // Formato: "192.168.1.7:8081" -> extrair apenas o IP
      const debuggerHost = Constants.expoConfig?.hostUri || Constants.debuggerHost;
      if (debuggerHost) {
        const ip = debuggerHost.split(':')[0];
        if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
          return ip;
        }
      }
    }
  } catch (error) {
    // Ignorar erros - expo-constants pode não estar disponível
  }
  return null;
};


export const getApiBaseUrl = (): string => {
  // FORÇAR NUVEM: Retorna direto a URL do seu backend
  // Removi a barra final '/' para evitar duplicidade (ex: //auth)
  // Mudado de /api/mobile para /api porque apenas o LighthouseController usa o prefixo mobile
  const url = 'http://adacompany.duckdns.org/api';
  
  console.log('[API] URL Fixa (Nuvem):', url);
  return url;
};

export const API_BASE_URL = getApiBaseUrl();
