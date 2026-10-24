import { createRouter } from "next-connect";
import {
  onNoMatchHandler,
  onErrorHandler,
  injectAnonymousOrUser,
  canRequest,
} from "infra/controller";

import activation from "models/activation";
import authorization from "models/authorization";

const router = createRouter();
router
  .use(injectAnonymousOrUser)
  .patch(canRequest("read:activation_token"), patchHandler);

export default router.handler({
  onNoMatch: onNoMatchHandler,
  onError: onErrorHandler,
});

async function patchHandler(req, res) {
  const tokenId = req.query.token_id;
  const userTryingToPatch = req.context.user;
  const validActivationtoken = await activation.findOneValidById(tokenId);

  const usedToken = await activation.markTokenAsUsed(tokenId);

  await activation.activateUserByUserId(validActivationtoken.user_id);

  const secureOutputValues = authorization.filterOutput(
    userTryingToPatch,
    "read:activation_token",
    usedToken,
  );

  return res.status(200).json(secureOutputValues);
}
