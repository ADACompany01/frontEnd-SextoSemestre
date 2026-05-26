import { describe, expect, it } from "vitest";
import { classifyIntent, getAdaResponse, normalizeText, tokenize } from "./adaNlpChatbot";

describe("ada NLP chatbot", () => {
  it("normaliza acentos e pontuacao antes da tokenizacao", () => {
    expect(normalizeText("Orçamento para Integração!")).toBe("orcamento para integracao");
    expect(tokenize("Quero um orçamento para site")).toEqual(["orcamento", "site"]);
  });

  it("classifica mensagens de orcamento com o modelo treinado", () => {
    const result = classifyIntent("preciso de uma proposta para desenvolver um site");

    expect(result.name).toBe("orcamento");
    expect(result.confidence).toBeGreaterThan(0);
  });

  it("responde com fallback quando a mensagem e vaga", () => {
    const result = getAdaResponse("oi", "Contato");

    expect(result.intent).toBe("fallback");
    expect(result.text).toContain("Contato".toLowerCase());
  });
});
