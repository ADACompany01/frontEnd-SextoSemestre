import Table from './Table';

const Projetos = () => (
  <div>
    <h2>Projetos</h2>
    <Table
      headers={['Nome', 'Status', '']}
      rows={[
        ['Projeto 01', 'Finalizado', <button className="portal-link">Ver detalhes</button>],
        ['Projeto 02', 'Em andamento', <button className="portal-link">Ver detalhes</button>],
      ]}
    />
  </div>
);

export default Projetos;