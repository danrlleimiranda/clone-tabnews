import {
  MethodNotAllowedError,
  InternalServerError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
} from "infra/errors";
import * as cookie from "cookie";
import { EXPIRATION_IN_MILLISECONDS } from "models/session";

export async function onErrorHandler(error, req, res) {
  if (error instanceof ValidationError || error instanceof NotFoundError) {
    return res.status(error.statusCode).json(error);
  }

  if (error instanceof UnauthorizedError) {
    clearSessionCookie(res);
    res.status(error.statusCode).json(error);
  }

  const publicErrorObject = new InternalServerError({
    cause: error,
  });

  console.error(publicErrorObject);

  res.status(publicErrorObject.statusCode).json(publicErrorObject);
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
