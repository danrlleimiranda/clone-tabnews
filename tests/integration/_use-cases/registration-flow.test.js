import webserver from "infra/webserver";
import activation from "models/activation";
import user from "models/user";
import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
  await orchestrator.deleteAllMails();
});
describe("Use case: Registration Flow (all successfull)", () => {
  let createdUserResponseBody;
  let activatedTokenId;
  test("Create user account", async () => {
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
      features: ["read:activation_token"],
      password: responseBody.password,
      created_at: responseBody.created_at,
      updated_at: responseBody.updated_at,
    });
    createdUserResponseBody = responseBody;
  });
  test("Receive activation email", async () => {
    const lastEmail = await orchestrator.getLastEmail();
    const token = orchestrator.extractUUID(lastEmail.text);
    const activationToken = await activation.findOneValidById(token);
    activatedTokenId = token;
    expect(lastEmail.text).toContain(
      `${webserver.origin}/cadastro/ativar/${token}`
    );

    expect(lastEmail.sender).toBe("<contato@dantab.com.br>");
    expect(lastEmail.recipients[0]).toBe("<danzin@gmail.com>");
    expect(lastEmail.subject).toBe("Ative seu cadastro!");
    expect(lastEmail.text).toContain("danzin");
    expect(lastEmail.text).toContain(activationToken.id);
    expect(createdUserResponseBody.id).toBe(activationToken.user_id);
    expect(activationToken.used_at).toBe(null);
  });
  test("Active account", async () => {
    const activationResponse = await fetch(
      `http://localhost:3000/api/v1/activations/${activatedTokenId}`,
      {
        method: "PATCH",
      }
    );

    expect(activationResponse.status).toBe(200);

    const activationResponseBody = activationResponse.json();

    expect(Date.parse(activationResponseBody.used_at)).not.toBeNaN();
    const activatedUser = await user.findOneByUsername("danzin");
    expect(activatedUser.features).toEqual(["create:session"]);
  });
  test("Login", () => {});
  test("Get user information", () => {});
});
