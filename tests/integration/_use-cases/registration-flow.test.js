import activation from "models/activation";
import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
  await orchestrator.deleteAllMails();
});

describe("Use case: Registration Flow (all successfull)", () => {
  let createUserResponseBody;
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
    createUserResponseBody = responseBody;
  });
  test("Receive activation email", async () => {
    const lastEmail = await orchestrator.getLastEmail();

    const activationToken = await activation.findOneByUserId(
      createUserResponseBody.id
    );

    expect(lastEmail.sender).toBe("<contato@dantab.com.br>");
    expect(lastEmail.recipients[0]).toBe("<danzin@gmail.com>");
    expect(lastEmail.subject).toBe("Ative seu cadastro!");
    expect(lastEmail.text).toContain("danzin");
    expect(lastEmail.text).toContain(activationToken.id);
  });
  test("Active account", () => {});
  test("Login", () => {});
  test("Get user information", () => {});
});
