export function getUserId() {
    const token = localStorage.getItem('token');
    if (!token) return null;
  
    try {
      const payloadBase64 = token.split('.')[1];
      const payloadJson = atob(payloadBase64);
      const payload = JSON.parse(payloadJson);
  
      return payload.id_cliente || null;  // 👈 Agora busca o id_cliente
    } catch (error) {
      console.error('Erro ao decodificar token:', error);
      return null;
    }
  }
  