import { createRouter } from "next-connect";
import {
  canRequest,
  injectAnonymousOrUser,
  onErrorHandler,
  onNoMatchHandler,
} from "infra/controller";
import user from "models/user";
import authorization from "models/authorization";
import { ForbiddenError } from "infra/errors";

const router = createRouter();

router
  .use(injectAnonymousOrUser)
  .get(getHandler)
  .patch(canRequest("update:user"), patchHandler);

export default router.handler({
  onError: onErrorHandler,
  onNoMatch: onNoMatchHandler,
});

async function getHandler(req, res) {
  const username = req.query.username;
  const contextUser = req.context.user;

  const userFound = await user.findOneByUsername(username);

  const secureOutputValues = authorization.filterOutput(
    contextUser,
    "read:user",
    userFound
  );
  return res.status(200).json(secureOutputValues);
}
async function patchHandler(req, res) {
  const username = req.query.username;
  const userInputValues = req.body;

  const userTryingToPatch = req.context.user;
  const targetUser = await user.findOneByUsername(username);

  if (!authorization.can(userTryingToPatch, "update:user", targetUser)) {
    throw new ForbiddenError({
      message: "Você não possui permissão para atualizar outro usuário",
      action:
        "Verifique se você possui a feature necessária para atualizar outro usuário",
    });
  }

  const updatedUser = await user.update(username, userInputValues);

  const secureOutputValues = authorization.filterOutput(
    userTryingToPatch,
    "read:user",
    updatedUser
  );

  return res.status(200).json(secureOutputValues);
}
