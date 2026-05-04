import { HashRouter as Router, Routes, Route } from "react-router-dom";
import styles from "./App.module.css";
import { About } from "./components/Servicos/About";
import { Contact } from "./components/Contact/Contact";
import { Experience } from "./components/Experience/Experience";
import { Hero } from "./components/Hero/Hero";
import { Navbar } from "./components/Navbar/Navbar";
import { Projects } from "./components/Projects/Projects";
import SignIn from "./components/sign-in/SignIn";
import SignUpClient from "./components/sign-up-client/SignUpClient";
import SignUpFuncionario from "./components/sign-up-funcionario/SignUpFuncionario";
import ListClient from "./components/list-client/ListClient";
import SignUpServico from "./components/sign-up-servico/SignUpServico"
import SignUpOrcamento from "./components/sign-up-orcamento/SignUpOrcamento"
import ClientAccess from "./components/client-access/client-access"; // Corrected import
import { AcessoAdmin } from "./components/admin-access-consulta/admin-access";
import { AcessoAdmin2 } from "./components/admin-access-cadastro/admin-access";
import ListFunc from "./components/list-func/ListFunc";
import ListService from "./components/list-services/ListService";
import ListBudget from "./components/list-budget/ListBudget";
import ClientPortalLayout from "./components/portal/ClientPortalLayout";
import Dashboard from "./components/portal/Dashboard";
import Orcamentos from "./components/portal/Orcamentos";
import Contratos from "./components/portal/Contratos";
import Projetos from "./components/portal/Projetos";
import { useEffect } from 'react';
import AdminDashboard from "./components/painel-admin/AdminDashboard";
import AdminPainel from "./components/painel-admin/AdminPainel";
import AdminLayout from "./components/painel-admin/AdminLayout";

function Home() {
  return (
    <div>
      <Hero />
      <About />
      <Projects />
      <Experience />
    </div>
  );
}

function Admin() {
  return (
    <div>
      <AcessoAdmin />
      <AcessoAdmin2 />
    </div>
  );
}

function App() {
  useEffect(() => {

if (!document.querySelector('div[vw]')) {
      const vlibrasDiv = document.createElement('div');
      vlibrasDiv.setAttribute('vw', '');
      vlibrasDiv.className = 'enabled';
      vlibrasDiv.innerHTML = `
        <div vw-access-button class="active"></div>
        <div vw-plugin-wrapper>
          <div class="vw-plugin-top-wrapper"></div>
        </div>
      `;
      document.body.appendChild(vlibrasDiv);
    }

    // Só adiciona o script se não existir
    if (!document.querySelector('script[src="https://vlibras.gov.br/app/vlibras-plugin.js"]')) {
      const scriptVLibras = document.createElement('script');
      scriptVLibras.src = 'https://vlibras.gov.br/app/vlibras-plugin.js';
      scriptVLibras.async = true;
      scriptVLibras.onload = () => {
        if (window.VLibras) {
          new window.VLibras.Widget('https://vlibras.gov.br/app');
        }
      };
      document.body.appendChild(scriptVLibras);
    } else {
      if (window.VLibras) {
        new window.VLibras.Widget('https://vlibras.gov.br/app');
      }
    }

const scriptUserWay = document.createElement('script');
  scriptUserWay.src = 'https://cdn.userway.org/widget.js';
  scriptUserWay.async = true;
  scriptUserWay.defer = true;

  window._userwayConfig = {
    account: '' // substitua pelo seu ID ou remova para versão básica
  };

  document.body.appendChild(scriptUserWay);
}, []);

  return (
    <Router>
      <div className={styles.App}>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/experience" element={<Experience />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signupclient" element={<SignUpClient />} />
          <Route path="/signupfuncionario" element={<SignUpFuncionario />} />
          <Route path="/listclient" element={<ListClient />} />
          <Route path="/listfunc" element={<ListFunc />} />
          <Route path="/signupservico" element={<SignUpServico />} />
          <Route path="/signuporcamento" element={<SignUpOrcamento />} />
          <Route path="/client" element={<ClientAccess />} />   {/* Corrected component name */}
          <Route path="/admin" element={<Admin />} />
          <Route path="/listservice" element={<ListService />} />
          <Route path="/listbudget" element={<ListBudget />} />
          <Route path="/portalcliente" element={<ClientPortalLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="orcamentos" element={<Orcamentos />} />
            <Route path="contratos" element={<Contratos />} />
            <Route path="projetos" element={<Projetos />} />
          </Route>
          <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="gerenciar-pedidos" element={<AdminPainel />} />
        </Route>
        </Routes>
        <Contact />
      </div>
    </Router>
  );
}
export default App;
