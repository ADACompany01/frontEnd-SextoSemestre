import { Link } from "react-router-dom";

const Sidebar = () => {
  const menu = [
    { label: 'Inicio', path: '' },
    { label: 'Pedido', path: 'orcamentos' }];

  return (
    <aside className="portal-sidebar">
      <h2>Cliente Portal</h2>
      <nav className="portal-nav">
        {menu.map(({ label, path }) => (
          <Link key={path} to={`/portalcliente/${path}`}>
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;