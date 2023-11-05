import { FastifyReply, FastifyRequest } from "fastify";
import * as Sentry from "@sentry/node";
import config from "./config";

const fastify = require("fastify")({
  logger: true,
});

interface IHandleErrorArgs {
  request: FastifyRequest;
  reply: FastifyReply;
  error: Error | unknown;
  statusCode: number;
  message?: string | undefined;
}

function initSentry() {
  Sentry.init({
    dsn: config.sentryDSN,
    tracesSampleRate: 1.0,
    integrations: [new Sentry.Integrations.Http({ tracing: true })],
  });
}

function getRequestInfo(request: FastifyRequest) {
  const { url, method, headers, params } = request;

  return {
    url,
    method,
    headers,
    params,
  };
}

async function handleError({
  request,
  reply,
  error,
  statusCode,
  message,
}: IHandleErrorArgs) {
  fastify.log.error(error);

  Sentry.captureException(error, {
    extra: {
      request: getRequestInfo(request),
      query: request.query,
      body: request.body,
    },
  });

  reply.code(statusCode).send({
    error: message,
  });
}

export { handleError, initSentry };
