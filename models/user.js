import database from "infra/database";
import { ValidationError } from "infra/errors";

export async function create(userInputValues) {
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
