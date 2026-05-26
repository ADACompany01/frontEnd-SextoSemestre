const intents = [
  {
    name: "orcamento",
    responses: [
      "Posso te ajudar com o orçamento. Me conte o tipo de projeto, objetivo, prazo e principais funcionalidades desejadas.",
      "Para iniciar um orçamento, preciso entender o escopo: site, sistema, acessibilidade, integrações e prazo esperado.",
    ],
    examples: [
      "quero um orçamento",
      "preciso de uma proposta",
      "quanto custa um site",
      "valor para desenvolver sistema",
      "preço de acessibilidade",
      "orçamento para projeto",
      "solicitar proposta personalizada",
    ],
  },
  {
    name: "site",
    responses: [
      "Criamos sites responsivos e acessíveis. A AdaCompany pode apoiar com páginas institucionais, blogs, landing pages, portfólios e áreas de serviço.",
      "Para um site, normalmente avaliamos público, objetivo, quantidade de páginas, identidade visual, acessibilidade e integrações.",
    ],
    examples: [
      "quero um site",
      "site para minha empresa",
      "landing page",
      "blog acessível",
      "site responsivo",
      "portfólio",
      "página de serviços",
    ],
  },
  {
    name: "acessibilidade",
    responses: [
      "Acessibilidade é parte central do nosso trabalho. Podemos orientar sobre contraste, navegação por teclado, textos alternativos, leitura de tela e boas práticas WCAG.",
      "A recomendação inicial costuma ser buscar conformidade WCAG AA, com testes automáticos e revisão manual dos fluxos principais.",
    ],
    examples: [
      "acessibilidade",
      "wcag",
      "leitor de tela",
      "contraste",
      "teclado",
      "site acessível",
      "inclusão digital",
      "vlibras",
    ],
  },
  {
    name: "suporte",
    responses: [
      "Entendi que você precisa de suporte. Me diga o que aconteceu, em qual página ou serviço, e se aparece alguma mensagem de erro.",
      "Para suporte, descreva o problema, quando começou e qual ação você tentou fazer. Assim consigo encaminhar melhor.",
    ],
    examples: [
      "preciso de suporte",
      "erro no sistema",
      "não consigo acessar",
      "problema técnico",
      "manutenção",
      "corrigir bug",
      "ajuda com painel",
    ],
  },
  {
    name: "sistema",
    responses: [
      "O sistema organiza solicitações, orçamentos, contratos e acompanhamento de projetos. Posso explicar uma parte específica se você quiser.",
      "Nossa área do cliente ajuda a centralizar documentos, status e comunicação do projeto.",
    ],
    examples: [
      "como funciona o sistema",
      "painel do cliente",
      "contratos",
      "acompanhar projeto",
      "solicitações",
      "área do cliente",
      "funcionalidades do sistema",
    ],
  },
  {
    name: "integracoes",
    responses: [
      "Podemos avaliar integrações com formulários, automações, ferramentas externas e área do cliente. Qual sistema você quer conectar?",
      "Integrações dependem do serviço externo e dos dados envolvidos. Me diga a ferramenta e o fluxo desejado.",
    ],
    examples: [
      "integração",
      "integrar sistema",
      "automação",
      "formulário",
      "api",
      "ferramenta externa",
      "conectar plataforma",
    ],
  },
  {
    name: "contato",
    responses: [
      "Posso continuar por aqui e coletar as informações principais. Se precisar, a equipe pode assumir depois com o contexto da conversa.",
      "Estou aqui para fazer a primeira triagem. Conte sua necessidade em uma frase e eu direciono o próximo passo.",
    ],
    examples: [
      "falar com atendente",
      "contato humano",
      "quero conversar",
      "atendimento",
      "vendedor",
      "comercial",
      "equipe",
    ],
  },
];

const stopwords = new Set([
  "a",
  "as",
  "com",
  "da",
  "de",
  "do",
  "e",
  "em",
  "eu",
  "me",
  "minha",
  "meu",
  "o",
  "os",
  "para",
  "por",
  "que",
  "quero",
  "um",
  "uma",
]);

function normalizeText(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(text) {
  return normalizeText(text)
    .split(" ")
    .filter((token) => token.length > 1 && !stopwords.has(token));
}

function trainModel(trainingIntents = intents) {
  const vocabulary = new Set();
  const model = trainingIntents.map((intent) => {
    const tokens = intent.examples.flatMap(tokenize);
    const frequencies = tokens.reduce((acc, token) => {
      vocabulary.add(token);
      acc[token] = (acc[token] || 0) + 1;
      return acc;
    }, {});

    return {
      ...intent,
      frequencies,
      totalTokens: tokens.length,
    };
  });

  return {
    vocabulary: Array.from(vocabulary),
    intents: model,
  };
}

const trainedModel = trainModel();

function scoreIntent(tokens, intent, vocabularySize) {
  if (!tokens.length) return Number.NEGATIVE_INFINITY;

  const denominator = intent.totalTokens + vocabularySize;
  return tokens.reduce((score, token) => {
    const frequency = intent.frequencies[token] || 0;
    return score + Math.log((frequency + 1) / denominator);
  }, Math.log(1 / intents.length));
}

function classifyIntent(message, model = trainedModel) {
  const tokens = tokenize(message);
  const vocabularySize = Math.max(model.vocabulary.length, 1);

  const ranked = model.intents
    .map((intent) => ({
      intent,
      score: scoreIntent(tokens, intent, vocabularySize),
    }))
    .sort((a, b) => b.score - a.score);

  const best = ranked[0];
  const second = ranked[1];
  const confidence = best && second ? Math.min(0.99, Math.max(0, best.score - second.score) / 3) : 0;

  if (!best || !tokens.length || confidence < 0.08) {
    return {
      name: "fallback",
      confidence,
    };
  }

  return {
    name: best.intent.name,
    confidence,
    intent: best.intent,
  };
}

function getAdaResponse(message, contextTitle = "") {
  const classification = classifyIntent(message);

  if (classification.name === "fallback") {
    const context = contextTitle ? ` sobre ${contextTitle.toLowerCase()}` : "";
    return {
      intent: "fallback",
      confidence: classification.confidence,
      text: `Ainda estou aprendendo, mas posso ajudar${context}. Me conte se você precisa de orçamento, suporte, acessibilidade, site, sistema ou integração.`,
    };
  }

  const responses = classification.intent.responses;
  const index = Math.abs(normalizeText(message).length) % responses.length;

  return {
    intent: classification.name,
    confidence: classification.confidence,
    text: responses[index],
  };
}

export { classifyIntent, getAdaResponse, normalizeText, tokenize, trainModel };
