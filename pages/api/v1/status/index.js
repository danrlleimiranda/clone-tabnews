import database from "infra/database.js";
import { InternalServerError } from "infra/errors";

async function status(req, res) {
  try {
    const updatedAt = new Date().toISOString();
    const databaseName = process.env.POSTGRES_DB;
    const maxConnections = await database.query("SHOW max_connections");
    const usedConnections = await database.query({
      text: "SELECT count(*)::int used from pg_stat_activity WHERE datname = $1;",
      values: [databaseName],
    });
    const pgVersion = await database.query("SHOW server_version");

    return res.status(200).json({
      updated_at: updatedAt,
      dependencies: {
        database: {
          version: pgVersion.rows[0].server_version,
          max_connections: parseInt(maxConnections.rows[0].max_connections),
          used_connections: usedConnections.rows[0].used,
        },
      },
    });
  } catch (error) {
    console.log("\n Erro dentro do catch do controller");
    const publicErrorObject = new InternalServerError({
      cause: error,
    });

    res.status(publicErrorObject.statusCode).json(publicErrorObject);
  }
}

export default status;
