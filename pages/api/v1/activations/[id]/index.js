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
  const tokenId = req.params.id;
  const activatedToken = await activation.update(tokenId);

  return res.status(200).json(activatedToken);
}
