import orchestrator from "tests/orchestrator";
import webserver from "infra/webserver";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("PATCH /api/v1/users/[username]", () => {
  describe("Anonymous user", () => {
    test("Can't a update a user", async () => {
      const patchResponse = await fetch(
        `${webserver.origin}/api/v1/users/newuser`,
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

      expect(patchResponse.status).toBe(403);

      expect(patchResponseBody).toEqual({
        action: "Verifique se o seu usuário possui a feature update:user",
        message: "Você não possui permissão para executar essa ação.",
        name: "ForbiddenError",
        status_code: 403,
      });
    });
  });

  describe("Default user", () => {
    test("With nonexistent username", async () => {
      const username = "nonexistent";
      const createdUser = await orchestrator.createUser({});
      const activatedUser = await orchestrator.activateUser(createdUser);
      const session = await orchestrator.createSession(activatedUser.id);

      const response = await fetch(
        `${webserver.origin}/api/v1/users/${username}`,
        {
          method: "PATCH",
          headers: {
            Cookie: `session_id=${session.token}`,
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
      await orchestrator.createUser({
        username: "user1",
        email: "email1@gmail.com",
        password: "senha123",
      });
      const user2 = await orchestrator.createUser({
        username: "user2",
        email: "email2@gmail.com",
        password: "senha123",
      });

      const activatedUser2 = await orchestrator.activateUser(user2);
      const session2 = await orchestrator.createSession(activatedUser2.id);

      const patchResponse = await fetch(
        `${webserver.origin}/api/v1/users/user2`,
        {
          method: "PATCH",
          body: JSON.stringify({
            username: "user1",
          }),
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${session2.token}`,
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

    test("With userb targeting usera", async () => {
      const user1 = await orchestrator.createUser({
        username: "usera",
        password: "senha123",
      });

      await orchestrator.addFeaturesToUser(user1, ["update:user"]);
      const user2 = await orchestrator.createUser({
        username: "userb",
        password: "senha123",
      });

      await orchestrator.addFeaturesToUser(user1, ["update:user"]);

      const activatedUser2 = await orchestrator.activateUser(user2);
      const session2 = await orchestrator.createSession(activatedUser2.id);

      const patchResponse = await fetch(
        `${webserver.origin}/api/v1/users/usera`,
        {
          method: "PATCH",
          body: JSON.stringify({
            username: "userc",
          }),
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${session2.token}`,
          },
        }
      );

      const patchResponseBody = await patchResponse.json();

      expect(patchResponse.status).toBe(403);

      expect(patchResponseBody).toEqual({
        action:
          "Verifique se você possui a feature necessária para atualizar outro usuário",
        message: "Você não possui permissão para atualizar outro usuário",
        name: "ForbiddenError",
        status_code: 403,
      });
    });

    test("With duplicated email", async () => {
      await orchestrator.createUser({
        email: "umemail@gmail.com",
      });

      const createduser2 = await orchestrator.createUser({
        email: "doisemail@gmail.com",
      });

      const activatedUser2 = await orchestrator.activateUser(createduser2);
      const session2 = await orchestrator.createSession(activatedUser2.id);

      const patchResponse = await fetch(
        `${webserver.origin}/api/v1/users/${createduser2.username}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            email: "umemail@gmail.com",
          }),
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${session2.token}`,
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
      const createdUser = await orchestrator.createUser({
        username: "newuser",
        email: "newuser@gmail.com",
        password: "senha123",
      });

      const activatedUser = await orchestrator.activateUser(createdUser);
      const session = await orchestrator.createSession(activatedUser.id);

      const patchResponse = await fetch(
        `${webserver.origin}/api/v1/users/newuser`,
        {
          method: "PATCH",
          body: JSON.stringify({
            email: "newuser1@gmail.com",
            username: "newuser1",
          }),
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${session.token}`,
          },
        }
      );

      const patchResponseBody = await patchResponse.json();

      expect(patchResponse.status).toBe(200);

      expect(patchResponseBody).toEqual({
        id: patchResponseBody.id,
        username: "newuser1",
        features: ["create:session", "read:session", "update:user"],
        created_at: patchResponseBody.created_at,
        updated_at: patchResponseBody.updated_at,
      });
    });
  });
  describe("Privileged user", () => {
    test("With update:user:others targeting defaultUser", async () => {
      const privilegedUser = await orchestrator.createUser({});
      const activatedPrivilegedUser = await orchestrator.activateUser(
        privilegedUser
      );

      await orchestrator.addFeaturesToUser(privilegedUser, [
        "update:user:others",
      ]);

      const privilegedUserSession = await orchestrator.createSession(
        activatedPrivilegedUser.id
      );

      const defaultUser = await orchestrator.createUser({});
      const updatedUser = await orchestrator.addFeaturesToUser(defaultUser, [
        "read:user",
      ]);

      const patchResponse = await fetch(
        `${webserver.origin}/api/v1/users/${defaultUser.username}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            username: "alteradoporprivilegiado",
          }),
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${privilegedUserSession.token}`,
          },
        }
      );

      const patchResponseBody = await patchResponse.json();

      expect(patchResponse.status).toBe(200);

      expect(patchResponseBody).toEqual({
        id: defaultUser.id,
        created_at: patchResponseBody.created_at,
        features: updatedUser.features,
        updated_at: patchResponseBody.updated_at,
        username: patchResponseBody.username,
      });
    });
  });
});
