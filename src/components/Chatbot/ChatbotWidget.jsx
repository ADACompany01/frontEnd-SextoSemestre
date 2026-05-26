import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import CloseIcon from "@mui/icons-material/Close";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import SendIcon from "@mui/icons-material/Send";
import styles from "./ChatbotWidget.module.css";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:3001/api"
    : "http://apiadacompany.duckdns.org/api");

const fallbackTree = {
  rootNodeId: "inicio",
  nodes: {
    inicio: {
      id: "inicio",
      title: "Inicio",
      message: "Ola! Como posso ajudar voce hoje?",
      options: [
        { id: "site", label: "1 - Site", description: "Quero um site para meu negocio", nextNodeId: "site" },
        { id: "orcamento", label: "2 - Orcamento", description: "Quero solicitar um orcamento", nextNodeId: "orcamento" },
        { id: "sistema", label: "3 - Sistema", description: "Quero informacoes sobre o sistema", nextNodeId: "sistema" },
        { id: "outras-funcoes", label: "4 - Outras funcoes", description: "Quero saber sobre outras funcoes", nextNodeId: "outras-funcoes" },
        { id: "atendente", label: "5 - Falar com atendente", description: "Quero falar com um atendente", nextNodeId: "atendente" },
      ],
    },
    site: {
      id: "site",
      title: "Site",
      message: "Criamos sites acessiveis e responsivos. Escolha o assunto que melhor combina com sua duvida.",
      options: [
        { id: "wcag", label: "1.1 - Conformidade WCAG", description: "Quero um site acessivel conforme as diretrizes WCAG", nextNodeId: "wcag" },
        { id: "tipos-site", label: "1.2 - Tipos de Site", description: "Quero conhecer os tipos de sites que voces criam", nextNodeId: "tipos-site" },
        { id: "recursos-site", label: "1.3 - Recursos Inclusos", description: "Quero saber o que esta incluido nos sites", nextNodeId: "recursos-site" },
      ],
    },
    orcamento: {
      id: "orcamento",
      title: "Orcamento",
      message: "Posso te direcionar para informar os dados do projeto ou para solicitar uma proposta personalizada.",
      options: [
        { id: "informar-dados", label: "2.1 - Informar Dados", description: "Vou informar os dados do meu projeto", nextNodeId: "informar-dados" },
        { id: "enviar-orcamento", label: "2.2 - Enviar Orcamento", description: "Quero receber uma proposta personalizada", nextNodeId: "enviar-orcamento" },
      ],
    },
    sistema: {
      id: "sistema",
      title: "Sistema",
      message: "Aqui voce encontra informacoes sobre funcionamento, planos, recursos e duvidas tecnicas.",
      options: [
        { id: "sobre-sistema", label: "3.1 - Sobre o Sistema", description: "Quero entender como o sistema funciona", nextNodeId: "sobre-sistema" },
        { id: "planos-recursos", label: "3.2 - Planos e Recursos", description: "Quero conhecer os planos e recursos disponiveis", nextNodeId: "planos-recursos" },
        { id: "duvidas-tecnicas", label: "3.3 - Duvidas Tecnicas", description: "Tenho duvidas sobre o uso ou funcionamento", nextNodeId: "duvidas-tecnicas" },
      ],
    },
    "outras-funcoes": {
      id: "outras-funcoes",
      title: "Outras Funcoes",
      message: "Tambem posso ajudar com suporte, treinamentos, tutoriais, integracoes e recursos adicionais.",
      options: [
        { id: "manutencao-suporte", label: "4.1 - Manutencao e Suporte", description: "Preciso de suporte ou manutencao", nextNodeId: "manutencao-suporte" },
        { id: "treinamentos", label: "4.2 - Treinamentos e Tutoriais", description: "Quero aprender mais com treinamentos e tutoriais", nextNodeId: "treinamentos" },
        { id: "integracoes", label: "4.3 - Integracoes e Recursos", description: "Quero saber sobre integracoes e recursos extras", nextNodeId: "integracoes" },
      ],
    },
    atendente: {
      id: "atendente",
      title: "Falar com Atendente",
      message: "Vou te direcionar para um atendente especializado.",
      options: [],
      action: { type: "handoff", label: "Ir para login", url: "/signin" },
    },
    wcag: {
      id: "wcag",
      title: "Conformidade WCAG",
      message: "A WCAG organiza a acessibilidade em niveis A, AA e AAA. Recomendamos AA para a maioria dos sites.",
      options: [],
      action: { type: "finish", label: "Encerrar atendimento" },
    },
    "tipos-site": {
      id: "tipos-site",
      title: "Tipos de Site",
      message: "Desenvolvemos sites institucionais, portfolios, blogs, landing pages e paginas de servicos.",
      options: [],
      action: { type: "navigate", label: "Ver exemplos", url: "/projects" },
    },
    "recursos-site": {
      id: "recursos-site",
      title: "Recursos Inclusos",
      message: "Os projetos podem incluir layout responsivo, acessibilidade, formularios, integracoes, publicacao e suporte inicial.",
      options: [],
      action: { type: "navigate", label: "Solicitar orcamento", url: "/signuporcamento" },
    },
    "informar-dados": {
      id: "informar-dados",
      title: "Informar Dados",
      message: "Informe tipo de projeto, objetivo, publico, prazo, recursos desejados e dados de contato.",
      options: [],
      action: { type: "navigate", label: "Preencher orcamento", url: "/signuporcamento" },
    },
    "enviar-orcamento": {
      id: "enviar-orcamento",
      title: "Enviar Orcamento",
      message: "Vamos preparar uma proposta personalizada com base nas necessidades do seu projeto.",
      options: [],
      action: { type: "navigate", label: "Solicitar proposta", url: "/signuporcamento" },
    },
    "sobre-sistema": {
      id: "sobre-sistema",
      title: "Sobre o Sistema",
      message: "O sistema centraliza solicitacoes, orcamentos, contratos e acompanhamento de projetos.",
      options: [],
      action: { type: "navigate", label: "Acessar painel", url: "/signin" },
    },
    "planos-recursos": {
      id: "planos-recursos",
      title: "Planos e Recursos",
      message: "Os planos variam conforme escopo, funcionalidades, integracoes, suporte e acessibilidade.",
      options: [],
      action: { type: "navigate", label: "Solicitar proposta", url: "/signuporcamento" },
    },
    "duvidas-tecnicas": {
      id: "duvidas-tecnicas",
      title: "Duvidas Tecnicas",
      message: "Podemos ajudar com uso, funcionamento, acessibilidade, desempenho, integracoes e manutencao.",
      options: [],
      action: { type: "handoff", label: "Falar com atendente", url: "/signin" },
    },
    "manutencao-suporte": {
      id: "manutencao-suporte",
      title: "Manutencao e Suporte",
      message: "Nosso suporte ajuda com ajustes, atualizacoes, correcao de problemas e melhoria de acessibilidade.",
      options: [],
      action: { type: "handoff", label: "Solicitar suporte", url: "/signin" },
    },
    treinamentos: {
      id: "treinamentos",
      title: "Treinamentos e Tutoriais",
      message: "Oferecemos orientacoes para uso do sistema, conteudo acessivel e administracao do projeto.",
      options: [],
      action: { type: "finish", label: "Encerrar atendimento" },
    },
    integracoes: {
      id: "integracoes",
      title: "Integracoes e Recursos",
      message: "Avaliamos integracoes com formularios, automacoes, ferramentas externas e area do cliente.",
      options: [],
      action: { type: "navigate", label: "Solicitar integracao", url: "/signuporcamento" },
    },
  },
};

function buildBotMessage(node) {
  return {
    id: `${node.id}-${Date.now()}`,
    author: "bot",
    title: node.title,
    text: node.message,
  };
}

export default function ChatbotWidget() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [tree, setTree] = useState(fallbackTree);
  const [currentNodeId, setCurrentNodeId] = useState(fallbackTree.rootNodeId);
  const [messages, setMessages] = useState([
    buildBotMessage(fallbackTree.nodes[fallbackTree.rootNodeId]),
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const panelRef = useRef(null);

  const currentNode = useMemo(
    () => tree.nodes[currentNodeId] || tree.nodes[tree.rootNodeId],
    [currentNodeId, tree],
  );

  useEffect(() => {
    let isMounted = true;

    async function loadTree() {
      try {
        const response = await fetch(`${API_BASE_URL}/chatbot/tree`);
        if (!response.ok) return;

        const payload = await response.json();
        if (!isMounted || !payload.data?.nodes) return;

        setTree(payload.data);
        setCurrentNodeId(payload.data.rootNodeId);
        setMessages([buildBotMessage(payload.data.nodes[payload.data.rootNodeId])]);
      } catch (error) {
        console.warn("Usando arvore local do chatbot.", error);
      }
    }

    loadTree();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (isOpen && panelRef.current) {
      panelRef.current.scrollTop = panelRef.current.scrollHeight;
    }
  }, [isOpen, messages]);

  async function chooseOption(option) {
    const userMessage = {
      id: `${option.id}-user-${Date.now()}`,
      author: "user",
      text: option.description,
    };

    setMessages((previous) => [...previous, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/chatbot/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodeId: currentNode.id, optionId: option.id }),
      });

      if (!response.ok) throw new Error("Falha ao consultar chatbot");

      const payload = await response.json();
      const nextNode = payload.data.node;

      setCurrentNodeId(nextNode.id);
      setMessages((previous) => [...previous, buildBotMessage(nextNode)]);
    } catch (error) {
      const nextNode = tree.nodes[option.nextNodeId] || tree.nodes[tree.rootNodeId];
      setCurrentNodeId(nextNode.id);
      setMessages((previous) => [...previous, buildBotMessage(nextNode)]);
    } finally {
      setIsLoading(false);
    }
  }

  function restartChat() {
    const rootNode = tree.nodes[tree.rootNodeId];
    setCurrentNodeId(rootNode.id);
    setMessages([buildBotMessage(rootNode)]);
  }

  function runAction() {
    if (!currentNode.action) return;

    if (currentNode.action.type === "finish") {
      restartChat();
      setIsOpen(false);
      return;
    }

    if (currentNode.action.url) {
      navigate(currentNode.action.url);
      setIsOpen(false);
    }
  }

  return (
    <div className={styles.chatbot} aria-live="polite">
      {isOpen && (
        <section className={styles.panel} aria-label="Chatbot AdaCompany">
          <header className={styles.header}>
            <div className={styles.headerTitle}>
              <SupportAgentIcon fontSize="small" />
              <span>Atendimento AdaCompany</span>
            </div>
            <div className={styles.headerActions}>
              <button type="button" onClick={restartChat} aria-label="Reiniciar conversa">
                <RestartAltIcon fontSize="small" />
              </button>
              <button type="button" onClick={() => setIsOpen(false)} aria-label="Fechar chatbot">
                <CloseIcon fontSize="small" />
              </button>
            </div>
          </header>

          <div className={styles.messages} ref={panelRef}>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`${styles.message} ${
                  message.author === "user" ? styles.userMessage : styles.botMessage
                }`}
              >
                {message.title && <strong>{message.title}</strong>}
                <span>{message.text}</span>
              </div>
            ))}
            {isLoading && <div className={`${styles.message} ${styles.botMessage}`}>Digitando...</div>}
          </div>

          <div className={styles.options}>
            {currentNode.options.map((option) => (
              <button
                type="button"
                key={option.id}
                onClick={() => chooseOption(option)}
                className={styles.optionButton}
              >
                <span>{option.label}</span>
                <small>{option.description}</small>
              </button>
            ))}

            {currentNode.action && (
              <button type="button" onClick={runAction} className={styles.actionButton}>
                <SendIcon fontSize="small" />
                <span>{currentNode.action.label}</span>
              </button>
            )}
          </div>
        </section>
      )}

      <button
        type="button"
        className={styles.toggle}
        onClick={() => setIsOpen((previous) => !previous)}
        aria-label={isOpen ? "Fechar chatbot" : "Abrir chatbot"}
      >
        {isOpen ? <CloseIcon /> : <ChatBubbleOutlineIcon />}
      </button>
    </div>
  );
}
