import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

import styles from "./Navbar.module.css";
import { getImageUrl } from "../../utils";

export const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    // Código do Hotjar
    (function (h, o, t, j, a, r) {
      h.hj =
        h.hj ||
        function () {
          (h.hj.q = h.hj.q || []).push(arguments);
        };
      h._hjSettings = { hjid: 5226215, hjsv: 6 };
      a = o.getElementsByTagName("head")[0];
      r = o.createElement("script");
      r.async = 1;
      r.src = t + h._hjSettings.hjid + j + h._hjSettings.hjsv;
      a.appendChild(r);
    })(window, document, "https://static.hotjar.com/c/hotjar-", ".js?sv=");
  }, []); // O useEffect será executado apenas uma vez após o primeiro render do componente

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/signin");
  };

  const handleMenu = () => {
    const decodedToken = jwtDecode(token);
    const userRole = decodedToken?.tipo_usuario; // Use tipo_usuario instead of role
    if (userRole === "cliente") {
      navigate("/portalcliente");
    } else if (userRole === "funcionario") {
      navigate("/admin");
    }
  };

  const handlePainel = () => {
    console.log("Painel clicked, token:", token);
    const decodedToken = jwtDecode(token);
    const userRole = decodedToken?.tipo_usuario; // Use tipo_usuario instead of role
    console.log("User role:", userRole);
    if (userRole === "cliente") {
      console.log("Navigating to /portalcliente");
      navigate("/portalcliente");
    } else if (userRole === "funcionario") {
      console.log("Navigating to /admin");
      navigate("/admin");
    }
  };

  const handleNavigateToSection = (sectionId) => {
    if (location.pathname === "/" || location.pathname === "/signin") {
      handleScrollToSection(sectionId);
    } else {
      navigate(`/${sectionId}`);
    }
  };

  const handleScrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav className={styles.navbar}>
      <a className={styles.title} href="/">
        AdaCompany
      </a>
      <div className={styles.menu}>
        <img
          className={styles.menuBtn}
          src={
            menuOpen
              ? getImageUrl("nav/closeIcon.png")
              : getImageUrl("nav/menuIcon.png")
          }
          alt="menu-button"
          onClick={() => setMenuOpen(!menuOpen)}
        />
        <ul
          className={`${styles.menuItems} ${menuOpen && styles.menuOpen}`}
        >
          <li onClick={() => setMenuOpen(false)}>
            <a onClick={() => handleNavigateToSection("About")}>Serviços</a>
          </li>
          <li onClick={() => setMenuOpen(false)}>
            <a onClick={() => handleNavigateToSection("projects")}>Exemplos</a>
          </li>
          {token ? (
            <>
              <li onClick={() => setMenuOpen(false)}>
                <a onClick={handlePainel}>Painel</a>
              </li>
              <li onClick={() => setMenuOpen(false)}>
                <a onClick={handleLogout}>Logout</a>
              </li>
            </>
          ) : (
            <li onClick={() => setMenuOpen(false)}>
              <Link to="/signin">Login</Link>
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
};
