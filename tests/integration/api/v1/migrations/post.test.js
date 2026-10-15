import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("POST /api/v1/migrations", () => {
  describe("Anonymous user", () => {
    describe("Running pending migrations", () => {
      test("For the first time", async () => {
        const response = await fetch(
          "http://localhost:3000/api/v1/migrations",
          {
            method: "POST",
          }
        );

        expect(response.status).toBe(403);

        const responseBody = await response.json();
        expect(responseBody).toEqual({
          action:
            "Verifique se o seu usuário possui a feature create:migration",
          message: "Você não possui permissão para executar essa ação.",
          name: "ForbiddenError",
          status_code: 403,
        });
      });

      test("For the second time", async () => {
        const response2 = await fetch(
          "http://localhost:3000/api/v1/migrations",
          {
            method: "POST",
          }
        );

        const response2Body = await response2.json();
        expect(response2.status).toBe(403);

        expect(response2Body).toEqual({
          action:
            "Verifique se o seu usuário possui a feature create:migration",
          message: "Você não possui permissão para executar essa ação.",
          name: "ForbiddenError",
          status_code: 403,
        });
      });
    });
  });
  describe("Privileged user", () => {
    describe("Running pending migrations", () => {
      test("For the first time", async () => {
        const createdUser = await orchestrator.createUser({});

        const activatedUser = await orchestrator.activateUser(createdUser);

        const updatedUser = await orchestrator.addFeaturesToUser(
          activatedUser,
          ["create:migration"]
        );

        const sessionObject = await orchestrator.createSession(updatedUser.id);

        const response = await fetch(
          "http://localhost:3000/api/v1/migrations",
          {
            method: "POST",
            headers: {
              Cookie: `session_id=${sessionObject.token}`,
            },
          }
        );

        expect(response.status).toBe(200);

        const responseBody = await response.json();
        expect(Array.isArray(responseBody)).toBe(true);
      });

      test("For the second time", async () => {
        const createdUser = await orchestrator.createUser({});

        const activatedUser = await orchestrator.activateUser(createdUser);

        const updatedUser = await orchestrator.addFeaturesToUser(
          activatedUser,
          ["create:migration"]
        );

        const sessionObject = await orchestrator.createSession(updatedUser.id);

        const response2 = await fetch(
          "http://localhost:3000/api/v1/migrations",
          {
            method: "POST",
            headers: {
              Cookie: `session_id=${sessionObject.token}`,
            },
          }
        );

        const response2Body = await response2.json();
        expect(response2.status).toBe(200);

        expect(Array.isArray(response2Body)).toBe(true);
      });
    });
  });
});
