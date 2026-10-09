import { createRouter } from "next-connect";
import { onNoMatchHandler, onErrorHandler } from "infra/controller";

import activation from "models/activation";

const router = createRouter();

router.patch(patchHandler);

export default router.handler({
  onNoMatch: onNoMatchHandler,
  onError: onErrorHandler,
});

async function patchHandler(req, res) {
  const tokenId = req.query.token_id;
  const validActivationtoken = await activation.findOneValidById(tokenId);

  const usedToken = await activation.markTokenAsUsed(tokenId);

  await activation.activateUserByUserId(validActivationtoken.user_id);
  return res.status(200).json(usedToken);
}
