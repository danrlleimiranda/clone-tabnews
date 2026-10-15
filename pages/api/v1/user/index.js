import { createRouter } from "next-connect";
import {
  onErrorHandler,
  onNoMatchHandler,
  setSessionCookie,
  canRequest,
  injectAnonymousOrUser,
} from "infra/controller";
import session from "models/session";
import user from "models/user";
import authorization from "models/authorization";

const router = createRouter();

router.use(injectAnonymousOrUser);
router.get(canRequest("read:session"), getHandler);

export default router.handler({
  onError: onErrorHandler,
  onNoMatch: onNoMatchHandler,
});

async function getHandler(req, res) {
  const sessionToken = req.cookies.session_id;
  const userTryingToGet = req.context.user;
  const sessionObject = await session.findOneValidByToken(sessionToken);

  const renewedSessionObject = await session.renew(sessionToken);

  setSessionCookie(res, renewedSessionObject.token);

  const userFound = await user.findOneById(sessionObject.user_id);

  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, max-age=0, must-revalidate"
  );

  const secureOutputValues = authorization.filterOutput(
    userTryingToGet,
    "read:user:self",
    userFound
  );

  return res.status(200).json(secureOutputValues);
}
