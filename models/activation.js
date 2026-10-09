import email from "infra/email";
import database from "infra/database";
import webserver from "infra/webserver";
import { NotFoundError, UnauthorizedError } from "infra/errors";
import user from "models/user";

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

async function findOneValidById(tokenId) {
  const validSession = await runSelectQuery(tokenId);
  return validSession;

  async function runSelectQuery(tokenId) {
    const results = await database.query({
      text: `
      SELECT 
        *
      FROM
        user_activation_tokens
      WHERE
        id = $1
      AND used_at IS NULL
      AND expires_at > now()
      LIMIT
        1`,
      values: [tokenId],
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

async function markTokenAsUsed(tokenId) {
  const activatedToken = await runUpdateQuery(tokenId);
  return activatedToken;

  async function runUpdateQuery(tokenId) {
    const response = await database.query({
      text: `UPDATE
              user_activation_tokens
            SET
              used_at = now(),
              updated_at = now()
            WHERE
              id = $1
            RETURNING
              *`,
      values: [tokenId],
    });

    if (response.rowCount === 0) {
      throw new NotFoundError({
        message:
          "O token de ativação utilizado não foi encontrado no sistema ou expirou.",
        action: "faça um novo cadastro.",
      });
    }

    return response.rows[0];
  }
}

async function activateUserByUserId(userId) {
  const updatedUser = await user.setFeatures(userId, ["create:session"]);
  return updatedUser;
}

const activation = {
  sendEmailToUser,
  create,
  findOneValidById,
  markTokenAsUsed,
  activateUserByUserId,
};

export default activation;
