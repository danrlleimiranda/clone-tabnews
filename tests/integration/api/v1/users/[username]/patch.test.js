import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/users/[username]", () => {
  describe("Anonymous user", () => {
    test("With nonexistent username", async () => {
      const username = "nonexistent";

      const response = await fetch(
        `http://localhost:3000/api/v1/users/${username}`,
        {
          method: "PATCH",
          body: {
            username: "existent",
          },
        }
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

    test("With duplicated username", async () => {
      const user1Response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        body: JSON.stringify({
          username: "user1",
          email: "email1@gmail.com",
          password: "senha123",
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      expect(user1Response.status).toBe(201);

      const user2Response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        body: JSON.stringify({
          username: "user2",
          email: "email2@gmail.com",
          password: "senha123",
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      expect(user2Response.status).toBe(201);

      const patchResponse = await fetch(
        "http://localhost:3000/api/v1/users/user2",
        {
          method: "PATCH",
          body: JSON.stringify({
            username: "user1",
          }),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const patchResponseBody = await patchResponse.json();

      expect(patchResponse.status).toBe(400);

      expect(patchResponseBody).toEqual({
        name: "ValidationError",
        message: "O username informado já está sendo utilizado",
        action: "Utilize outro username para esta operação.",
        status_code: 400,
      });
    });

    test("With duplicated email", async () => {
      const user1Response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        body: JSON.stringify({
          username: "umusername",
          email: "umemail@gmail.com",
          password: "senha123",
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      expect(user1Response.status).toBe(201);

      const user2Response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        body: JSON.stringify({
          username: "doisusername",
          email: "doisemail@gmail.com",
          password: "senha123",
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      expect(user2Response.status).toBe(201);

      const patchResponse = await fetch(
        "http://localhost:3000/api/v1/users/doisusername",
        {
          method: "PATCH",
          body: JSON.stringify({
            email: "umemail@gmail.com",
          }),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const patchResponseBody = await patchResponse.json();

      expect(patchResponse.status).toBe(400);

      expect(patchResponseBody).toEqual({
        name: "ValidationError",
        message: "O email informado já está sendo utilizado",
        action: "Utilize outro email para esta operação.",
        status_code: 400,
      });
    });

    test("Updates a user succesfully", async () => {
      const user1Response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        body: JSON.stringify({
          username: "newuser",
          email: "newuser@gmail.com",
          password: "senha123",
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      expect(user1Response.status).toBe(201);

      const patchResponse = await fetch(
        "http://localhost:3000/api/v1/users/newuser",
        {
          method: "PATCH",
          body: JSON.stringify({
            email: "newuser1@gmail.com",
            username: "newuser1",
          }),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const patchResponseBody = await patchResponse.json();

      expect(patchResponse.status).toBe(200);

      expect(patchResponseBody).toEqual({
        id: patchResponseBody.id,
        email: "newuser1@gmail.com",
        username: "newuser1",
        created_at: patchResponseBody.created_at,
        updated_at: patchResponseBody.updated_at,
        password: patchResponseBody.password,
      });
    });
  });
});
