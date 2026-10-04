import { createRouter } from "next-connect";
import { onNoMatchHandler, onErrorHandler } from "infra/controller";
import authentication from "models/authentication";
import session, { EXPIRATION_IN_MILLISECONDS } from "models/session";

import * as cookie from "cookie";

const router = createRouter();

router.post(postHandler);

export default router.handler({
  onNoMatch: onNoMatchHandler,
  onError: onErrorHandler,
});

async function postHandler(req, res) {
  const userInputValues = req.body;
  const authenticatedUser = await authentication.getAuthemticatedUser(
    userInputValues.email,
    userInputValues.password
  );

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
