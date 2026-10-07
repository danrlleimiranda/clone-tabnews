import { EXPIRATION_IN_MILLISECONDS } from "models/session";
import orchestrator from "tests/orchestrator";
import { version } from "uuid";
import setCookieParser from "set-cookie-parser";
beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("POST /api/v1/sessions", () => {
  describe("Anonymous user", () => {
    test("With incorrect email but with correct password", async () => {
      await orchestrator.createUser({
        password: "senhacorreta",
      });

      const response = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "POST",
        body: JSON.stringify({
          email: "email.errado@gmail.com",
          password: "senhacorreta",
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      expect(response.status).toBe(401);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "UnauthorizedError",
        message: "Dados da autenticação não conferem.",
        action: "Verifique se os dados enviados estão corretos.",
        status_code: 401,
      });
    });

    test("With incorrect password but with correct email", async () => {
      await orchestrator.createUser({
        email: "email.correto@email.com",
      });

      const response = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "POST",
        body: JSON.stringify({
          email: "email.correto@email.com",
          password: "senhaerrada",
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      expect(response.status).toBe(401);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "UnauthorizedError",
        message: "Dados da autenticação não conferem.",
        action: "Verifique se os dados enviados estão corretos.",
        status_code: 401,
      });
    });

    test("With incorrect password and incorrect email", async () => {
      await orchestrator.createUser({});

      const response = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "POST",
        body: JSON.stringify({
          email: "email.incorreta@email.com",
          password: "senhaerrada",
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      expect(response.status).toBe(401);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "UnauthorizedError",
        message: "Dados da autenticação não conferem.",
        action: "Verifique se os dados enviados estão corretos.",
        status_code: 401,
      });
    });

    test("With correct password and correct email", async () => {
      const createdUser = await orchestrator.createUser({
        email: "tudo.correto@email.com",
        password: "tudocorreto",
      });

      const response = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "POST",
        body: JSON.stringify({
          email: "tudo.correto@email.com",
          password: "tudocorreto",
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      expect(response.status).toBe(201);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: responseBody.id,
        token: responseBody.token,
        user_id: createdUser.id,
        expires_at: responseBody.expires_at,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(version(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
      expect(Date.parse(responseBody.expires_at)).not.toBeNaN();

      const expiresAt = new Date(responseBody.expires_at);
      const createdAt = new Date(responseBody.created_at);

      expiresAt.setMilliseconds(0);
      createdAt.setMilliseconds(0);

      expect(expiresAt - createdAt).toBe(EXPIRATION_IN_MILLISECONDS);

      const parsedSetCookie = setCookieParser(response, {
        map: true,
      });

      expect(parsedSetCookie).toEqual({
        session_id: {
          name: "session_id",
          value: responseBody.token,
          maxAge: EXPIRATION_IN_MILLISECONDS / 1000,
          path: "/",
          httpOnly: true,
        },
      });

      
    });
  });
});
