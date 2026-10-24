import { createRouter } from "next-connect";
import {
  injectAnonymousOrUser,
  onErrorHandler,
  onNoMatchHandler,
} from "infra/controller";
import { retrieveDatabaseStatus } from "models/status";
import authorization from "models/authorization";

const router = createRouter();

router.use(injectAnonymousOrUser).get(getHandler);

export default router.handler({
  onNoMatch: onNoMatchHandler,
  onError: onErrorHandler,
});

async function getHandler(req, res) {
  const authenticatedUser = req.context.user;
  const databaseStatus = await retrieveDatabaseStatus();
  const outputSecureValues = authorization.filterOutput(
    authenticatedUser,
    "read:status",
    databaseStatus,
  );
  return res.status(200).json(outputSecureValues);
}
