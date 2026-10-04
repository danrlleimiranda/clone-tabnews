import orchestrator from "tests/orchestrator";
import { version } from "uuid";
import { EXPIRATION_IN_MILLISECONDS } from "models/session";
import session from "models/session";
import setCookieParser from "set-cookie-parser";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/user", () => {
  describe("Default user", () => {
    test("With valid session", async () => {
      const createdUser = await orchestrator.createUser({});

      const sessionObject = await orchestrator.createSession(createdUser.id);
      const response = await fetch("http://localhost:3000/api/v1/user", {
        headers: {
          Cookie: `session_id=${sessionObject.token}`,
        },
      });

      const cacheControl = response.headers.get("Cache-Control");
      expect(cacheControl).toBe(
        "no-store, no-cache, max-age=0, must-revalidate"
      );

      const responseBody = await response.json();
      expect(response.status).toBe(200);
      expect(responseBody).toEqual({
        id: responseBody.id,
        username: createdUser.username,
        email: createdUser.email,
        password: responseBody.password,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });
      expect(version(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      const renewedSessionObject = await session.findOneValidByToken(
        sessionObject.token
      );

      expect(renewedSessionObject.expires_at > sessionObject.expires_at).toBe(
        true
      );

      expect(renewedSessionObject.updated_at > sessionObject.updated_at).toBe(
        true
      );

      const parsedSetCookie = setCookieParser(response, {
        map: true,
      });

      expect(parsedSetCookie).toEqual({
        session_id: {
          name: "session_id",
          value: renewedSessionObject.token,
          maxAge: EXPIRATION_IN_MILLISECONDS / 1000,
          path: "/",
          httpOnly: true,
        },
      });
    });
    test("With session expiring in 15 days", async () => {
      const EXPIRATION_IN_FIFTEEN_DAYS_IN_MILLISECONDS =
        60 * 60 * 24 * 15 * 1000;
      jest.useFakeTimers({
        now: new Date(Date.now() - EXPIRATION_IN_FIFTEEN_DAYS_IN_MILLISECONDS),
      });

      const createdUser = await orchestrator.createUser({});

      const sessionObject = await orchestrator.createSession(createdUser.id);

      jest.useRealTimers();
      const response = await fetch("http://localhost:3000/api/v1/user", {
        headers: {
          Cookie: `session_id=${sessionObject.token}`,
        },
      });

      const responseBody = await response.json();
      expect(response.status).toBe(200);
      expect(responseBody).toEqual({
        id: responseBody.id,
        username: createdUser.username,
        email: createdUser.email,
        password: responseBody.password,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });
      expect(version(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      const renewedSessionObject = await session.findOneValidByToken(
        sessionObject.token
      );

      expect(renewedSessionObject.expires_at > sessionObject.expires_at).toBe(
        true
      );

      expect(renewedSessionObject.updated_at > sessionObject.updated_at).toBe(
        true
      );

      const parsedSetCookie = setCookieParser(response, {
        map: true,
      });

      expect(parsedSetCookie).toEqual({
        session_id: {
          name: "session_id",
          value: renewedSessionObject.token,
          maxAge: EXPIRATION_IN_MILLISECONDS / 1000,
          path: "/",
          httpOnly: true,
        },
      });
    });

    test("With nonexistent session", async () => {
      const nonexistent = "nonexistentsessiontoken";

      const response = await fetch("http://localhost:3000/api/v1/user", {
        headers: {
          Cookie: `session_id=${nonexistent}`,
        },
      });

      expect(response.status).toBe(401);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "UnauthorizedError",
        message: "Usuário não possui sessão ativa.",
        action: "Verifique se este usuário está logado e tente novamente.",
        status_code: 401,
      });
    });

    test("With expired session", async () => {
      jest.useFakeTimers({
        now: new Date(Date.now() - EXPIRATION_IN_MILLISECONDS),
      });

      const createdUser = await orchestrator.createUser({});

      const sessionObject = await orchestrator.createSession(createdUser.id);

      jest.useRealTimers();

      const response = await fetch("http://localhost:3000/api/v1/user", {
        headers: {
          Cookie: `session_id=${sessionObject.token}`,
        },
      });

      expect(response.status).toBe(401);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "UnauthorizedError",
        message: "Usuário não possui sessão ativa.",
        action: "Verifique se este usuário está logado e tente novamente.",
        status_code: 401,
      });
    });
  });
});
