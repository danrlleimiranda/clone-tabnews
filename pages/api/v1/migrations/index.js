import { createRouter } from "next-connect";
import {
  onNoMatchHandler,
  onErrorHandler,
  injectAnonymousOrUser,
  canRequest,
} from "infra/controller";
import migrator from "models/migrator";
import authorization from "models/authorization";

const router = createRouter();
router
  .use(injectAnonymousOrUser)
  .get(canRequest("read:migration"), getHandler)
  .post(canRequest("create:migration"), postHandler);

export default router.handler({
  onNoMatch: onNoMatchHandler,
  onError: onErrorHandler,
});

async function getHandler(req, res) {
  const authenticatedUser = req.context.user;
  const pendingMigrations = await migrator.listPendingMigrations();

  const outputSecureValues = authorization.filterOutput(
    authenticatedUser,
    "create:migration",
    pendingMigrations
  );

  return res.status(200).json(outputSecureValues);
}

async function postHandler(req, res) {
  const authenticatedUser = req.context.user;
  const migratedMigrations = await migrator.runPendingMigrations();

  if (migratedMigrations.length > 0) {
    return res.status(201).json(migratedMigrations);
  }

  const outputSecureValues = authorization.filterOutput(
    authenticatedUser,
    "create:migration",
    migratedMigrations
  );

  return res.status(200).json(outputSecureValues);
}
