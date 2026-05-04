export function getImageUrl(name) {
  return new URL(`../assets/${name}`, import.meta.url).href;
}

// Função para decodificar token JWT e extrair informações do usuário
export function decodeToken(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => `%${('00' + c.charCodeAt(0).toString(16)).slice(-2)}`)
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Erro ao decodificar token:', error);
    return null;
  }
}

// Função para extrair userId do token
export function getUserIdFromToken(token) {
  const decoded = decodeToken(token);
  if (!decoded) return null;
  
  // Tenta diferentes possíveis campos para o ID do usuário
  return decoded.id || decoded.sub || decoded.userId || decoded.user_id || decoded.id_usuario;
}

// Função para obter userId do localStorage
export function getUserId() {
  const token = localStorage.getItem('token');
  if (!token) return null;
  
  return getUserIdFromToken(token);
}