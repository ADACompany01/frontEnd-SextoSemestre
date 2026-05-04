import { useEffect, useState } from "react";
import styles from './AdminPainel.module.css';

const AdminPainel = () => {
  const [contratos, setContratos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchContratos = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('=== DEBUG CONTRATOS ===');
        const token = localStorage.getItem("token");
        console.log('Token:', token ? 'Presente' : 'Ausente');
        
        // Tentar diferentes endpoints possíveis
        const endpoints = [
          "http://localhost:3000/contratos",
          "http://localhost:3000/contrato",
          "http://localhost:3000/api/contratos",
          "http://localhost:3000/api/contrato"
        ];
        
        let data = null;
        let usedEndpoint = "";
        
        for (const endpoint of endpoints) {
          try {
            console.log('Tentando endpoint:', endpoint);
            const response = await fetch(endpoint, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            
            console.log('Status da resposta para', endpoint, ':', response.status);
            
            if (response.ok) {
              data = await response.json();
              usedEndpoint = endpoint;
              console.log('Sucesso com endpoint:', endpoint);
              console.log('Dados recebidos:', data);
              break;
            }
          } catch (err) {
            console.log('Erro com endpoint', endpoint, ':', err.message);
          }
        }
        
        if (!data) {
          throw new Error('Nenhum endpoint de contratos funcionou');
        }
        
        // Verificar se os dados são realmente contratos
        if (data.data && Array.isArray(data.data)) {
          const firstItem = data.data[0];
          console.log('Primeiro item:', firstItem);
          
          // Se tem campos de orçamento, pode ser que o endpoint esteja retornando orçamentos
          if (firstItem && (firstItem.cod_orcamento || firstItem.valor_orcamento)) {
            console.warn('ATENÇÃO: O endpoint está retornando orçamentos em vez de contratos!');
            console.warn('Endpoint usado:', usedEndpoint);
            console.warn('Dados recebidos:', data);
          }
        }
        
        setContratos(data.data || data || []);
      } catch (err) {
        console.error('Erro ao buscar contratos:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchContratos();
  }, []);

  const atualizarStatus = async (id, status) => {
    try {
      console.log('Atualizando contrato:', id, 'para status:', status);
      
      const response = await fetch(`http://localhost:3000/contratos/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ status_contrato: status }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro ao atualizar: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Contrato atualizado:', result);
      
      // Recarrega os dados em vez de recarregar a página
      window.location.reload();
    } catch (error) {
      console.error('Erro ao atualizar contrato:', error);
      alert(`Erro ao atualizar contrato: ${error.message}`);
    }
  };

  if (loading) {
    return <div className={styles.container}>Carregando contratos...</div>;
  }

  if (error) {
    return <div className={styles.container}>Erro ao carregar contratos: {error}</div>;
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Gerenciar Contratos</h2>
      {contratos.length === 0 ? (
        <p>Nenhum contrato encontrado.</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Início</th>
              <th>Entrega</th>
              <th>Valor</th>
              <th>Status</th>
              <th>Atualizar</th>
            </tr>
          </thead>
          <tbody>
            {contratos.map((c) => (
              <tr key={c.id_contrato || c.cod_orcamento}>
                <td>
                  {c.orcamento?.pacote?.cliente?.nome || 
                   c.orcamento?.cliente?.nome || 
                   c.cliente?.nome ||
                   c.pacote?.cliente?.nome ||
                   "—"}
                </td>
                <td>{c.data_inicio ? new Date(c.data_inicio).toLocaleDateString() : "—"}</td>
                <td>{c.data_entrega ? new Date(c.data_entrega).toLocaleDateString() : "—"}</td>
                <td>R$ {Number(c.valor_contrato || c.valor_orcamento || 0).toFixed(2)}</td>
                <td>{formatarStatus(c.status_contrato || c.status)}</td>
                <td>
                  <select
                    value={c.status_contrato || c.status || ""}
                    onChange={(e) => atualizarStatus(c.id_contrato || c.cod_orcamento, e.target.value)}
                  >
                    <option value="EM_ANALISE">Em Análise</option>
                    <option value="EM_ANDAMENTO">Em Andamento</option>
                    <option value="CONCLUIDO">Concluído</option>
                    <option value="CANCELADO">Cancelado</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

const formatarStatus = (status) => {
  switch (status) {
    case 'EM_ANALISE': return 'Em Análise';
    case 'EM_ANDAMENTO': return 'Em Andamento';
    case 'CONCLUIDO': return 'Concluído';
    case 'CANCELADO': return 'Cancelado';
    case 'em_analise': return 'Em Análise';
    case 'em_andamento': return 'Em Andamento';
    case 'concluido': return 'Concluído';
    case 'cancelado': return 'Cancelado';
    default: return status || '—';
  }
};

export default AdminPainel;
