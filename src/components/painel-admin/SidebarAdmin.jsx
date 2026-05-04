import { Link } from "react-router-dom";
import "./SidebarAdmin.css";

const SidebarAdmin = () => {
  const menu = [
    { label: 'Dashboard', path: '' },
    { label: 'Pedidos', path: 'gerenciar-pedidos' }
  ];

  return (
    <aside className="admin-sidebar">
      <h2>Painel Admin</h2>
      <nav className="admin-nav">
        {menu.map(({ label, path }) => (
          <Link key={path} to={`/admin/${path}`}>
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
};

export default SidebarAdmin;
