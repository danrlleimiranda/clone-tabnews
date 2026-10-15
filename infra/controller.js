import {
  MethodNotAllowedError,
  InternalServerError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
} from "infra/errors";
import * as cookie from "cookie";
import { EXPIRATION_IN_MILLISECONDS } from "models/session";
import session from "models/session";
import user from "models/user";
import authorization from "models/authorization";

export async function onErrorHandler(error, req, res) {
  if (
    error instanceof ValidationError ||
    error instanceof NotFoundError ||
    error instanceof ForbiddenError
  ) {
    return res.status(error.statusCode).json(error);
  }

  if (error instanceof UnauthorizedError) {
    clearSessionCookie(res);
    return res.status(error.statusCode).json(error);
  }

  const publicErrorObject = new InternalServerError({
    cause: error,
  });

  console.error(publicErrorObject);

  return res.status(publicErrorObject.statusCode).json(publicErrorObject);
}

export async function onNoMatchHandler(req, res) {
  const publicErrorObject = new MethodNotAllowedError();
  return res.status(publicErrorObject.statusCode).json(publicErrorObject);
}

export function setSessionCookie(res, sessionToken) {
  const setCookie = cookie.serialize("session_id", sessionToken, {
    path: "/",
    maxAge: EXPIRATION_IN_MILLISECONDS / 1000,
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
  });

  res.setHeader("Set-Cookie", setCookie);
}

export function clearSessionCookie(res) {
  const setCookie = cookie.serialize("session_id", "invalid", {
    path: "/",
    maxAge: -1,
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
  });

  res.setHeader("Set-Cookie", setCookie);
}

export async function injectAnonymousOrUser(req, res, next) {
  req.cookies.session_id;
  if (req.cookies?.session_id) {
    await injectAuthenticatedUser(req);
    return next();
  }

  injectAnonymousUser(req);
  return next();
}

async function injectAuthenticatedUser(req) {
  const sessionToken = req.cookies.session_id;
  const sessionObject = await session.findOneValidByToken(sessionToken);

  const userObject = await user.findOneById(sessionObject.user_id);

  req.context = { ...req.context, user: userObject };
}

function injectAnonymousUser(req) {
  const anonymousUser = {
    features: [
      "read:activation_token",
      "create:session",
      "create:user",
      "read:status",
    ],
  };

  req.context = { ...req.context, user: anonymousUser };
}

export function canRequest(feature) {
  return function can(req, _res, next) {
    const userTryingToRequest = req.context.user;

    if (authorization.can(userTryingToRequest, feature)) {
      return next();
    }

    throw new ForbiddenError({
      message: "Você não possui permissão para executar essa ação.",
      action: `Verifique se o seu usuário possui a feature ${feature}`,
    });
  };
}
