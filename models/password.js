import bcryptjs from "bcryptjs";

async function hash(password) {
  const rounds = process.env.PASSWORD_ROUNDS;
  const pepper = process.env.PASSWORD_PEPPER;

  const pepperPassword = password + pepper;

  return await bcryptjs.hash(pepperPassword, Number(rounds));
}

async function compare(providedPassword, storedPassword) {
  const pepper = process.env.PASSWORD_PEPPER;
  const spicyPassword = providedPassword + pepper;
  return await bcryptjs.compare(spicyPassword, storedPassword);
}

const password = { hash, compare };

export default password;
