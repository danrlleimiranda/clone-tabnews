import bcryptjs from "bcryptjs";

async function hash(password) {
  const rounds = process.env.PASSWORD_ROUNDS;
  const pepper = process.env.PASSWORD_PEPPER;

  const pepperPassword = password + pepper;

  return await bcryptjs.hash(pepperPassword, Number(rounds));
}

async function compare(providedPassword, storedPassword) {
  return await bcryptjs.compare(providedPassword, storedPassword);
}

const password = { hash, compare };

export default password;
