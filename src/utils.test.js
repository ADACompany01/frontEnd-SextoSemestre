import { afterEach, describe, expect, it, vi } from "vitest";
import { decodeToken, getUserId, getUserIdFromToken } from "./utils";
import { getUserId as getClientUserId } from "./utils/auth";

function createToken(payload) {
  const encodedPayload = btoa(JSON.stringify(payload))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  return `header.${encodedPayload}.signature`;
}

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("token utilities", () => {
  it("decodifica o payload de um JWT valido", () => {
    const payload = { id: "123", tipo_usuario: "cliente" };

    expect(decodeToken(createToken(payload))).toEqual(payload);
  });

  it("retorna null quando o JWT e invalido", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    expect(decodeToken("token-invalido")).toBeNull();
  });

  it("extrai o id do usuario usando os campos suportados", () => {
    expect(getUserIdFromToken(createToken({ id: "id-1" }))).toBe("id-1");
    expect(getUserIdFromToken(createToken({ sub: "sub-1" }))).toBe("sub-1");
    expect(getUserIdFromToken(createToken({ userId: "user-1" }))).toBe("user-1");
    expect(getUserIdFromToken(createToken({ user_id: "user-id-1" }))).toBe("user-id-1");
    expect(getUserIdFromToken(createToken({ id_usuario: "usuario-1" }))).toBe("usuario-1");
  });

  it("le o token do localStorage para obter o id do usuario", () => {
    localStorage.setItem("token", createToken({ userId: "42" }));

    expect(getUserId()).toBe("42");
  });

  it("retorna null quando nao existe token salvo", () => {
    expect(getUserId()).toBeNull();
  });
});

describe("client auth utilities", () => {
  it("extrai id_cliente do token salvo no localStorage", () => {
    localStorage.setItem("token", createToken({ id_cliente: "cliente-10" }));

    expect(getClientUserId()).toBe("cliente-10");
  });

  it("retorna null quando o token do cliente e invalido", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    localStorage.setItem("token", "token-invalido");

    expect(getClientUserId()).toBeNull();
  });
});
