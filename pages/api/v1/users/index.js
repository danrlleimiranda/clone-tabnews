import { createRouter } from "next-connect";
import { onErrorHandler, onNoMatchHandler } from "infra/controller";
import user from "models/user";
import activation from "models/activation";

const router = createRouter();

router.post(postHandler);

export default router.handler({
  onError: onErrorHandler,
  onNoMatch: onNoMatchHandler,
});

async function postHandler(req, res) {
  const userInputValues = req.body;
  const userResponse = await user.create(userInputValues);

  const activationToken = await activation.create(userResponse.id);
  await activation.sendEmailToUser(userResponse, activationToken);
  return res.status(201).json(userResponse);
}
