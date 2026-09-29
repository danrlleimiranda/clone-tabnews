import { createRouter } from "next-connect";
import { onErrorHandler, onNoMatchHandler } from "infra/controller";
import { create } from "models/user";

const router = createRouter();

router.post(postHandler);

export default router.handler({
  onError: onErrorHandler,
  onNoMatch: onNoMatchHandler,
});

async function postHandler(req, res) {
  const userInputValues = req.body;
  const userResponse = await create(userInputValues);

  return res.status(userResponse?.status).json(userResponse.data);
}
