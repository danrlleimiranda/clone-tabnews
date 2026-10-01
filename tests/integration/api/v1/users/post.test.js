import orchestrator from "tests/orchestrator";
import { version } from "uuid";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("POST /api/v1/users", () => {
  describe("Anonymous user", () => {
    test("With unique and valid data", async () => {
      const response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        body: JSON.stringify({
          username: "danzin",
          email: "danzin@gmail.com",
          password: "senha123",
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const responseBody = await response.json();
      expect(response.status).toBe(201);
      expect(responseBody).toEqual({
        id: responseBody.id,
        username: "danzin",
        email: "danzin@gmail.com",
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });
      expect(version(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
    });

    test("With duplicated email", async () => {
      const response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        body: JSON.stringify({
          username: "duplicado",
          email: "duplicado@gmail.com",
          password: "senha123",
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      expect(response.status).toBe(201);

      const response2 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        body: JSON.stringify({
          username: "duplicado2",
          email: "duplicado@gmail.com",
          password: "senha123",
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      expect(response2.status).toBe(400);

      const response2Body = await response2.json();

      expect(response2Body).toEqual({
        name: "ValidationError",
        message: "O email informado já está sendo utilizado",
        action: "Utilize outro email para realizar o cadastro.",
        status_code: 400,
      });
    });

    test("With duplicated username", async () => {
      const response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        body: JSON.stringify({
          username: "duplicado2",
          email: "email@gmail.com",
          password: "senha123",
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      expect(response.status).toBe(201);

      const response2 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        body: JSON.stringify({
          username: "duplicado2",
          email: "email1@gmail.com",
          password: "senha123",
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      expect(response2.status).toBe(400);

      const response2Body = await response2.json();

      expect(response2Body).toEqual({
        name: "ValidationError",
        message: "O username informado já está sendo utilizado",
        action: "Utilize outro username para esta operação.",
        status_code: 400,
      });
    });
  });
});
