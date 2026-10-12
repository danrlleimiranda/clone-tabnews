import { createRouter } from "next-connect";
import {
  onNoMatchHandler,
  onErrorHandler,
  clearSessionCookie,
  injectAnonymousOrUser,
  canRequest,
} from "infra/controller";
import authentication from "models/authentication";
import session, { EXPIRATION_IN_MILLISECONDS } from "models/session";

import * as cookie from "cookie";
import authorization from "models/authorization";
import { ForbiddenError } from "infra/errors";

const router = createRouter();

router.use(injectAnonymousOrUser);
router.post(canRequest("create:session"), postHandler);
router.delete(deleteHandler);

export default router.handler({
  onNoMatch: onNoMatchHandler,
  onError: onErrorHandler,
});

async function postHandler(req, res) {
  const userInputValues = req.body;
  const authenticatedUser = await authentication.getAuthenticatedUser(
    userInputValues.email,
    userInputValues.password
  );

  if (!authorization.can(authenticatedUser, "create:session")) {
    throw new ForbiddenError({
      message: "Você não possui permissão para fazer login.",
      action: "Contate o suporte caso você acredite que seja um problema.",
    });
  }

  const newSession = await session.create(authenticatedUser.id);

  const setCookie = cookie.serialize("session_id", newSession.token, {
    path: "/",
    maxAge: EXPIRATION_IN_MILLISECONDS / 1000,
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
  });

  res.setHeader("Set-Cookie", setCookie);

  return res.status(201).json(newSession);
}

async function deleteHandler(req, res) {
  const sessionToken = req.cookies.session_id;

  const sessionObject = await session.findOneValidByToken(sessionToken);

  const expiredSession = await session.expireById(sessionObject.id);

  clearSessionCookie(res);

  return res.status(200).json(expiredSession);
}
