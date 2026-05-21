import Table from './Table';

const Projetos = () => (
  <div>
    <h2>Projetos</h2>
    <Table
      headers={['Nome', 'Status', '']}
      rows={[
        ['Projeto 01', 'Finalizado', <button key="project-01-details" className="portal-link">Ver detalhes</button>],
        ['Projeto 02', 'Em andamento', <button key="project-02-details" className="portal-link">Ver detalhes</button>],
      ]}
    />
  </div>
);

export default Projetos;
