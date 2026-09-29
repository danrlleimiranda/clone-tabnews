import orchestrator from "tests/orchestrator";
import { version } from "uuid";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/users/[username]", () => {
  describe("Anonymous user", () => {
    test("With exact case match", async () => {
      const response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        body: JSON.stringify({
          username: "mesmocase",
          email: "email@gmail.com",
          password: "senha123",
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      expect(response.status).toBe(201);
      const username = "mesmocase";
      const response2 = await fetch(
        `http://localhost:3000/api/v1/users/${username}`
      );

      expect(response2.status).toBe(200);

      const response2Body = await response.json();

      expect(response2Body).toEqual({
        id: response2Body.id,
        username: "mesmocase",
        email: "email@gmail.com",
        created_at: response2Body.created_at,
        updated_at: response2Body.updated_at,
      });

      expect(version(response2Body.id)).toBe(4);
      expect(Date.parse(response2Body.created_at)).not.toBeNaN();
      expect(Date.parse(response2Body.updated_at)).not.toBeNaN();
    });

    test("With case mismatch", async () => {
      const response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        body: JSON.stringify({
          username: "CaseDiferente",
          email: "diferente@gmail.com",
          password: "senha123",
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      expect(response.status).toBe(201);
      console.log(await response.json());

      const username = "casediferente";
      const response2 = await fetch(
        `http://localhost:3000/api/v1/users/${username}`
      );

      expect(response2.status).toBe(200);

      const response2Body = await response2.json();

      console.log(response2Body);

      expect(response2Body).toEqual({
        id: response2Body.id,
        username: "CaseDiferente",
        email: "diferente@gmail.com",
        created_at: response2Body.created_at,
        updated_at: response2Body.updated_at,
      });

      expect(version(response2Body.id)).toBe(4);
      expect(Date.parse(response2Body.created_at)).not.toBeNaN();
      expect(Date.parse(response2Body.updated_at)).not.toBeNaN();
    });

    test("With nonexistent username", async () => {
      const username = "nonexistent";
      const response = await fetch(
        `http://localhost:3000/api/v1/users/${username}`
      );

      expect(response.status).toBe(404);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "NotFoundError",
        message: "O username informado não foi encontrado no sistema",
        action: "Verifique se o username está digitado corretamente",
        status_code: 404,
      });
    });
  });
});
