import database from "infra/database";
import { ValidationError, NotFoundError } from "infra/errors";
import password from "./password";
async function create(userInputValues) {
  if (!userInputValues) {
    throw new ValidationError({
      message: "O input informado está vazio",
      action: "Utilize dados existentes para cadastro",
    });
  }

  await validateUniqueEmail(userInputValues.email);
  await validateUniqueUsername(userInputValues.username);
  const hashedPassword = await hashPasswordInObject(userInputValues);

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
      hashedPassword,
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
      action: "Utilize outro email para esta operação.",
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
      action: "Utilize outro username para esta operação.",
    });
  }
}

async function hashPasswordInObject(userInputValues) {
  const hashedPassword = await password.hash(userInputValues.password);
  return hashedPassword;
}

async function findOneByUsername(username) {
  const userFound = await runSelectQuery(username);
  return userFound;

  async function runSelectQuery(username) {
    const results = await database.query({
      text: `
      SELECT
       id, username, email, password, created_at, updated_at
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

async function findOneByEmail(email) {
  const userFound = await runSelectQuery(email);
  return userFound;

  async function runSelectQuery(email) {
    const results = await database.query({
      text: `
      SELECT
       id, username, email, password, created_at, updated_at
      FROM
        users
      WHERE
        LOWER(email) = LOWER($1)
      LIMIT 1
        `,
      values: [email],
    });

    if (results.rowCount === 0) {
      throw new NotFoundError({
        action: "Verifique se o email está digitado corretamente",
        message: "O email informado não foi encontrado no sistema",
      });
    }
    return results.rows[0];
  }
}

async function update(username, userInputValues) {
  const user = await findOneByUsername(username);

  if ("username" in userInputValues) {
    await validateUniqueUsername(userInputValues.username);
  }
  if ("email" in userInputValues) {
    await validateUniqueEmail(userInputValues.email);
  }

  if ("password" in userInputValues) {
    const newPassword = await hashPasswordInObject(userInputValues);
    userInputValues.password = newPassword;
  }

  const infoUser = { ...user, ...userInputValues };

  const updatedUser = await runUpdateQuery(infoUser);

  async function runUpdateQuery(infoUser) {
    const updatedUser = await database.query({
      text: `
      UPDATE
       users
      SET
       username = $1,
       email = $2,
       password = $3,
       updated_at = timezone('utc', now())
      WHERE id = $4
      RETURNING
        *`,
      values: [
        infoUser.username,
        infoUser.email,
        infoUser.password,
        infoUser.id,
      ],
    });

    return updatedUser.rows[0];
  }

  return updatedUser;
}

const user = {
  findOneByUsername,
  create,
  update,
  findOneByEmail,
};

export default user;
