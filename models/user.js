import database from "infra/database";

export async function create(userInputValues) {
  try {
    if (!userInputValues) {
      return { status: 400, data: "Os dados do usuário devem ser enviados." };
    }

    const user = await database.query({
      text: "SELECT * FROM users WHERE email = $1",
      values: [userInputValues.email.toLowerCase()],
    });

    if (user.rows.length) {
      return { status: 409, data: "Usuário já cadastrado." };
    }

    const newUser = await database.query({
      text: "INSERT INTO users (username, password, email) VALUES ($1, $2, $3) RETURNING *",
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
  } catch (error) {
    console.error(error);
    return {
      status: 500,
      data: "Algo de errado não está certo.",
    };
  }
}
