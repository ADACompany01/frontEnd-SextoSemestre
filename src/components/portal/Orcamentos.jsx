import { useEffect, useState } from 'react';
import './Portal.css'; // importe seu css aqui

const Orcamentos = () => {
  const [contratos, setContratos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  function getUserId() {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
      const payloadBase64 = token.split('.')[1];
      const payloadJson = atob(payloadBase64);
      const payload = JSON.parse(payloadJson);
      return payload.id_usuario || null;
    } catch {
      return null;
    }
  }

  const userId = getUserId();
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchContratos = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!token) throw new Error('Token não encontrado');
        if (!userId) throw new Error('User ID não encontrado');

        const response = await fetch('http://localhost:3001/contratos', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error(`Erro ao buscar contratos: ${response.status}`);

        const contratosData = await response.json();

        console.log('Contratos recebidos:', contratosData);

        // Filtra só os contratos do cliente logado
        const contratosDoUsuario = contratosData.filter(
          (contrato) => contrato.orcamento?.pacote?.cliente?.id_usuario === userId
        );

        console.log('Contratos do usuário:', contratosDoUsuario);

        setContratos(contratosDoUsuario);
      } catch (err) {
        console.error('Erro ao carregar contratos:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchContratos();
  }, [userId, token]);

  if (loading) return <div className="dashboard-result">Carregando contratos...</div>;
  if (error) return <div className="dashboard-result" style={{ color: 'red' }}>Erro ao carregar contratos: {error}</div>;
  if (contratos.length === 0) return <div className="dashboard-result">Você ainda não possui contratos cadastrados.</div>;

  return (
    <div className="dashboard-content">
      <h2 className="dashboard-title">Seus Contratos</h2>
      <table className="portal-table">
        <thead>
          <tr>
            <th>Código Orçamento</th>
            <th>Valor Contrato</th>
            <th>Status</th>
            <th>Data Início</th>
            <th>Data Entrega</th>
          </tr>
        </thead>
        <tbody>
          {contratos.map((c) => (
            <tr key={c.id_contrato}>
              <td>{c.cod_orcamento}</td>
              <td>R$ {Number(c.valor_contrato).toFixed(2)}</td>
              <td style={{ textTransform: 'capitalize' }}>{c.status_contrato.toLowerCase()}</td>
              <td>{c.data_inicio ? new Date(c.data_inicio).toLocaleDateString() : '—'}</td>
              <td>{c.data_entrega ? new Date(c.data_entrega).toLocaleDateString() : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Orcamentos;
