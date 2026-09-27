import { createRouter } from "next-connect";
import { onErrorHandler, onNoMatchHandler } from "infra/controller";
import { retrieveDatabaseStatus } from "models/status";

const router = createRouter();

router.get(getHandler);

export default router.handler({
  onNoMatch: onNoMatchHandler,
  onError: onErrorHandler,
});

async function getHandler(req, res) {
  const databaseStatus = await retrieveDatabaseStatus();
  return res.status(200).json(databaseStatus);
}
