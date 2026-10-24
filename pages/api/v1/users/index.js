import { createRouter } from "next-connect";
import {
  canRequest,
  injectAnonymousOrUser,
  onErrorHandler,
  onNoMatchHandler,
} from "infra/controller";
import user from "models/user";
import activation from "models/activation";
import authorization from "models/authorization";

const router = createRouter()
  .use(injectAnonymousOrUser)
  .post(canRequest("create:user"), postHandler);

export default router.handler({
  onError: onErrorHandler,
  onNoMatch: onNoMatchHandler,
});

async function postHandler(req, res) {
  const userInputValues = req.body;
  const userResponse = await user.create(userInputValues);
  const userTryingToPost = req.context.user;

  const activationToken = await activation.create(userResponse.id);
  await activation.sendEmailToUser(userResponse, activationToken);

  const secureOutputValues = authorization.filterOutput(
    userTryingToPost,
    "read:user",
    userResponse,
  );
  return res.status(201).json(secureOutputValues);
}
