import email from "infra/email";
import database from "infra/database";
import webserver from "infra/webserver";
import { UnauthorizedError } from "infra/errors";

const EXPIRATION_IN_MILLISECONDS = 60 * 15 * 1000;
async function create(userId) {
  const expiresAt = new Date(Date.now() + EXPIRATION_IN_MILLISECONDS);

  const newToken = await runInsertQuery(userId, expiresAt);

  return newToken;

  async function runInsertQuery(userId, expiresAt) {
    const results = await database.query({
      text: `
      INSERT INTO
        user_activation_tokens (user_id, expires_at)
      VALUES
        ($1, $2)
        RETURNING
        *`,
      values: [userId, expiresAt],
    });

    return results.rows[0];
  }
}

async function sendEmailToUser(user, activationToken) {
  await email.send({
    from: "DanTab <contato@dantab.com.br>",
    to: user.email,
    subject: "Ative seu cadastro!",
    text: `${user.username}, clique no link abaixo para ativar sua conta.
${webserver.origin}/cadastro/ativar/${activationToken.id}

Atenciosamente
Equipe DanTab`,
  });
}

async function findOneByUserId(userId) {
  const validSession = await runSelectQuery(userId);
  return validSession;

  async function runSelectQuery(userId) {
    const results = await database.query({
      text: `
      SELECT 
        *
      FROM
        user_activation_tokens
      WHERE
        user_id = $1
      LIMIT
        1`,
      values: [userId],
    });

    if (!results.rowCount) {
      throw new UnauthorizedError({
        message: "Usuário não possui token de ativação.",
        action: "Verifique se este usuário está logado e tente novamente.",
      });
    }

    return results.rows[0];
  }
}

const activation = { sendEmailToUser, create, findOneByUserId };

export default activation;
