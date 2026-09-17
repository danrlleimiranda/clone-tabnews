import database from "infra/database.js"

async function status(req, res) {
  const result = await database.query("SELECT 1 + 1 AS sum;");

  return res.status(200).json({ sum: result?.rows })
}

export default status;