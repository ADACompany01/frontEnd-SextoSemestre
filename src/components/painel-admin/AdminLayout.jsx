import { Outlet } from "react-router-dom";
import SidebarAdmin from "./SidebarAdmin";

const AdminLayout = () => {
  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <SidebarAdmin />
      <main style={{ flex: 1, padding: "2rem", marginLeft: "0px", backgroundColor: "#f9f9f9" }}>
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
