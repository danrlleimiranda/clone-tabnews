import webserver from "infra/webserver";
import activation from "models/activation";
import { EXPIRATION_IN_MILLISECONDS } from "models/activation";
import orchestrator from "tests/orchestrator";
import { version } from "uuid";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("PATCH /api/v1/activations/[token_id]", () => {
  describe("Anonymous user", () => {
    test("With nonexistent token", async () => {
      const response = await fetch(
        `${webserver.origin}/api/v1/activations/44761ae0-b9b5-4cbb-a388-2fab9b2670af`,
        {
          method: "PATCH",
        }
      );

      expect(response.status).toBe(404);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "NotFoundError",
        message: "O token de ativação utilizado não foi encontrado no sistema.",
        action: "Faça um novo cadastro.",
        status_code: 404,
      });
    });

    test("With expired token", async () => {
      jest.useFakeTimers({
        now: new Date(Date.now() - EXPIRATION_IN_MILLISECONDS),
      });

      const createdUser = await orchestrator.createUser({
        username: "user1",
        email: "email1@gmail.com",
        password: "senha123",
      });

      const expiredActivationToken = await activation.create(createdUser.id);

      jest.useRealTimers();

      const patchResponse = await fetch(
        `${webserver.origin}/api/v1/activations/${expiredActivationToken.id}`,
        {
          method: "PATCH",
        }
      );

      const patchResponseBody = await patchResponse.json();

      expect(patchResponse.status).toBe(404);

      expect(patchResponseBody).toEqual({
        name: "NotFoundError",
        message: "O token de ativação utilizado não foi encontrado no sistema.",
        action: "Faça um novo cadastro.",
        status_code: 404,
      });
    });

    test("With already used token", async () => {
      const createdUser = await orchestrator.createUser({});

      const activationToken = await activation.create(createdUser.id);

      const response1 = await fetch(
        `${webserver.origin}/api/v1/activations/${activationToken.id}`,
        {
          method: "PATCH",
        }
      );

      expect(response1.status).toBe(200);

      const response2 = await fetch(
        `${webserver.origin}/api/v1/activations/${activationToken.id}`,
        {
          method: "PATCH",
        }
      );

      const response2Body = await response2.json();

      expect(response2.status).toBe(404);

      expect(response2Body).toEqual({
        name: "NotFoundError",
        message: "O token de ativação utilizado não foi encontrado no sistema.",
        action: "Faça um novo cadastro.",
        status_code: 404,
      });
    });

    test("With valid token", async () => {
      const createdUser = await orchestrator.createUser({});

      const activationToken = await activation.create(createdUser.id);

      const patchResponse = await fetch(
        `${webserver.origin}/api/v1/activations/${activationToken.id}`,
        {
          method: "PATCH",
        }
      );

      const patchResponseBody = await patchResponse.json();

      expect(patchResponse.status).toBe(200);

      expect(patchResponseBody).toEqual({
        id: activationToken.id,
        used_at: patchResponseBody.used_at,
        user_id: createdUser.id,
        expires_at: activationToken.expires_at.toISOString(),
        created_at: activationToken.created_at.toISOString(),
        updated_at: patchResponseBody.updated_at,
      });

      expect(version(patchResponseBody.id)).toBe(4);
      expect(Date.parse(patchResponseBody.created_at)).not.toBeNaN();
      expect(Date.parse(patchResponseBody.updated_at)).not.toBeNaN();
      expect(Date.parse(patchResponseBody.expires_at)).not.toBeNaN();

      const expiresAt = new Date(patchResponseBody.expires_at);
      const createdAt = new Date(patchResponseBody.created_at);

      expiresAt.setMilliseconds(0);
      createdAt.setMilliseconds(0);

      expect(expiresAt - createdAt).toBe(EXPIRATION_IN_MILLISECONDS);
    });

    test("With valid token but already activated user", async () => {
      const createdUser = await orchestrator.createUser({});

      await orchestrator.activateUser(createdUser);

      const activationToken = await activation.create(createdUser.id);

      const patchResponse = await fetch(
        `${webserver.origin}/api/v1/activations/${activationToken.id}`,
        {
          method: "PATCH",
        }
      );

      const patchResponseBody = await patchResponse.json();

      expect(patchResponse.status).toBe(403);

      expect(patchResponseBody).toEqual({
        action: "Entre em contato com o suporte.",
        message: "Você não pode mais utilizar tokens de ativação.",
        name: "ForbiddenError",
        status_code: 403,
      });
    });

    test("With valid token but already logged in user", async () => {
      const user1 = await orchestrator.createUser({});

      const activated = await orchestrator.activateUser(user1);

      const user1Session = await orchestrator.createSession(activated);

      const user2 = await orchestrator.createUser({});

      const user2ActivationToken = await activation.create(user2.id);

      const patchResponse = await fetch(
        `${webserver.origin}/api/v1/activations/${user2ActivationToken.id}`,
        {
          method: "PATCH",
          headers: {
            Cookie: `session_id=${user1Session.token}`,
          },
        }
      );

      const patchResponseBody = await patchResponse.json();
      expect(patchResponse.status).toBe(403);

      expect(patchResponseBody).toEqual({
        action:
          "Verifique se o seu usuário possui a feature read:activation_token",
        message: "Você não possui permissão para executar essa ação.",
        name: "ForbiddenError",
        status_code: 403,
      });
    });
  });
});
