import retry from "async-retry";
import database from "infra/database";
import migrator from "models/migrator";
import user from "models/user";
import { faker } from "@faker-js/faker";
import session from "models/session";

const emailHttpUrl = `http://${process.env.EMAIL_SMTP_HOST}:1080`;
// const emailHttpUrl = "http://localhost:1080";
async function waitForAllServices() {
  await waitForWebServer();
  await waitForEmailServer();

  async function waitForWebServer() {
    return retry(fetchStatusPage, {
      retries: 100,
      maxTimeout: 1000,
    });

    async function fetchStatusPage() {
      const response = await fetch("http://localhost:3000/api/v1/status");

      if (!response.ok) {
        throw new Error();
      }

      await response.json();
    }
  }
  async function waitForEmailServer() {
    return retry(fetchEmailPage, {
      retries: 100,
      maxTimeout: 1000,
    });

    async function fetchEmailPage() {
      const response = await fetch(`${emailHttpUrl}/messages`);

      if (!response.ok) {
        throw new Error();
      }

      await response.json();
    }
  }
}

async function clearDatabase() {
  await database.query("drop schema public cascade; create schema public");
}

async function runPendingMigrations() {
  await migrator.runPendingMigrations();
}

async function createUser(userObject) {
  const randomUsername = faker.internet.username().replace(/[_.-]/g, "");
  const randomEmail = faker.internet.email();
  const createdUser = await user.create({
    username: userObject.username || randomUsername,
    email: userObject.email || randomEmail,
    password: userObject.password || "senhavalida",
  });

  return createdUser;
}

async function createSession(userId) {
  return await session.create(userId);
}

async function deleteAllMails() {
  await fetch(`${emailHttpUrl}/messages`, {
    method: "DELETE",
  });
}

async function getLastEmail() {
  const response = await fetch(`${emailHttpUrl}/messages`);

  const emails = await response.json();

  const lastEmail = emails.pop();

  if (!lastEmail) {
    return null;
  }

  const emailTextResponse = await fetch(
    `${emailHttpUrl}/messages/${lastEmail.id}.plain`
  );

  const emailTextBody = await emailTextResponse.text();

  lastEmail.text = emailTextBody;
  return lastEmail;
}

const orchestrator = {
  waitForAllServices,
  clearDatabase,
  runPendingMigrations,
  createUser,
  createSession,
  deleteAllMails,
  getLastEmail,
};

export default orchestrator;
