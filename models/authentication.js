import user from "models/user";
import { UnauthorizedError } from "infra/errors";
import password from "models/password";

async function getAuthenticatedUser(providedEmail, providedPassowrd) {
  let storedUser;
  try {
    storedUser = await findUserByEmail(providedEmail);
    await validatePassowrd(providedPassowrd, storedUser.password);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw new UnauthorizedError({
        message: "Dados da autenticação não conferem.",
        action: "Verifique se os dados enviados estão corretos.",
      });
    }
  }

  async function findUserByEmail(providedEmail) {
    let storedUser;

    try {
      storedUser = await user.findOneByEmail(providedEmail);

      return storedUser;
    } catch (error) {
      throw new UnauthorizedError({
        message: "Email não confere.",
        action: "Verifique se este dado está correto.",
      });
    }
  }

  async function validatePassowrd(providedPassowrd, storedPassword) {
    const correctPasswordMatch = await password.compare(
      providedPassowrd,
      storedPassword
    );

    if (!correctPasswordMatch) {
      throw new UnauthorizedError({
        message: "Senha não confere.",
        action: "Verifique se este dado está correto.",
      });
    }
  }

  return storedUser;
}

const authentication = { getAuthenticatedUser };

export default authentication;
