import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/status", () => {
  describe("Anonymous user", () => {
    test("Retrieving application status", async () => {
      const response = await fetch("http://localhost:3000/api/v1/status");

      expect(response.status).toBe(200);
      const responseBody = await response.json();
      expect(responseBody.updated_at).toBeDefined();
      const parsedUpdatedAt = new Date(responseBody.updated_at).toISOString();
      expect(responseBody.updated_at).toEqual(parsedUpdatedAt);
      expect(responseBody.dependencies.database.max_connections).toBeDefined();
      expect(responseBody.dependencies.database.max_connections).toEqual(100);
      expect(responseBody.dependencies.database.used_connections).toBeDefined();
      expect(responseBody.dependencies.database.used_connections).toEqual(1);
    });
  });

  describe("Privileged user", () => {
    test("Retrieving application status", async () => {
      const createdUser = await orchestrator.createUser({});

      const activatedUser = await orchestrator.activateUser(createdUser);

      const updatedUser = await orchestrator.addFeaturesToUser(activatedUser, [
        "read:status:all",
      ]);

      const sessionObject = await orchestrator.createSession(updatedUser.id);

      const response = await fetch("http://localhost:3000/api/v1/status", {
        method: "GET",
        headers: {
          Cookie: `session_id=${sessionObject.token}`,
        },
      });

      expect(response.status).toBe(200);
      const responseBody = await response.json();
      expect(responseBody.updated_at).toBeDefined();
      const parsedUpdatedAt = new Date(responseBody.updated_at).toISOString();
      expect(responseBody.updated_at).toEqual(parsedUpdatedAt);
      expect(responseBody.dependencies.database.max_connections).toBeDefined();
      expect(responseBody.dependencies.database.max_connections).toEqual(100);
      expect(responseBody.dependencies.database.used_connections).toBeDefined();
      expect(responseBody.dependencies.database.used_connections).toEqual(1);
      expect(responseBody.dependencies.database.version).toBeDefined();
      expect(responseBody.dependencies.database.version).toEqual("16.3");
    });
  });
});
