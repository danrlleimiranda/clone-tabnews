import database from "infra/database";
import { ValidationError, NotFoundError } from "infra/errors";

async function create(userInputValues) {
  if (!userInputValues) {
    throw new ValidationError({
      message: "O input informado está vazio",
      action: "Utilize dados existentes para cadastro",
    });
  }

  await validateUniqueEmail(userInputValues.email);
  await validateUniqueUsername(userInputValues.username);

  const newUser = await database.query({
    text: `
      INSERT INTO
        users
          (username, password, email)
      VALUES
          ($1, $2, $3)
      RETURNING *
      `,
    values: [
      userInputValues.username,
      userInputValues.password,
      userInputValues.email.toLowerCase(),
    ],
  });

  return {
    status: 201,
    data: {
      id: newUser.rows[0].id,
      username: newUser.rows[0].username,
      email: newUser.rows[0].email,
      created_at: newUser.rows[0].created_at,
      updated_at: newUser.rows[0].updated_at,
    },
  };
}

async function validateUniqueEmail(email) {
  const user = await database.query({
    text: "SELECT email FROM users WHERE LOWER(email) = $1",
    values: [email.toLowerCase()],
  });

  if (user.rowCount > 0) {
    throw new ValidationError({
      message: "O email informado já está sendo utilizado",
      action: "Utilize outro email para realizar o cadastro.",
    });
  }
}
async function validateUniqueUsername(username) {
  const user = await database.query({
    text: "SELECT username FROM users WHERE LOWER(username) = LOWER($1)",
    values: [username],
  });

  if (user.rowCount > 0) {
    throw new ValidationError({
      message: "O username informado já está sendo utilizado",
      action: "Utilize outro username para realizar o cadastro.",
    });
  }
}

async function findOneByUsername(username) {
  const userFound = await runSelectQuery(username);
  return userFound;

  async function runSelectQuery(username) {
    const results = await database.query({
      text: `
      SELECT
       id, username, email, created_at, updated_at
      FROM
        users
      WHERE
        LOWER(username) = LOWER($1)
      LIMIT 1
        `,
      values: [username],
    });

    if (results.rowCount === 0) {
      throw new NotFoundError({
        action: "Verifique se o username está digitado corretamente",
        message: "O username informado não foi encontrado no sistema",
      });
    }
    return results.rows[0];
  }
}

const user = {
  findOneByUsername,
  create,
};

export default user;
