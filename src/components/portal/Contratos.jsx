import Table from './Table';

const Contratos = () => (
  <div>
    <h2>Contratos</h2>
    <Table
      headers={['Nome', 'Número', 'Data de Assinatura', 'Status']}
      rows={[
        ['Contrato A', '123', '02/01/2025', 'Vigente'],
        ['Contrato B', '124', '15/03/2025', 'Encerrado'],
      ]}
    />
  </div>
);

export default Contratos;