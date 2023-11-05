import Fastify from "fastify";
import cors from "@fastify/cors";
import { initSentry } from "./service/error";
import * as Sentry from "@sentry/node";
import fastifyExpress from "@fastify/express";

async function main() {
  const server = Fastify({ logger: true });
  const path = require("node:path");

  initSentry();

  server
    .register(cors, (instance) => {
      return (req, callback) => {
        const corsOptions = {
          origin: true,
        };

        // do not include CORS headers for requests from localhost
        if (/^localhost$/m.test(req.headers.origin)) {
          corsOptions.origin = false;
        }
        callback(null, corsOptions);
      };
    })
    .register(require("@fastify/multipart"), {})
    .register(require("@fastify/static"), {
      root: path.join(__dirname, "..", "public"), // .. because this is run in dist folder
      prefix: "/",
      constraints: {}, // optional: default {}
    })
    .register(fastifyExpress)
    .after(() => {
      server.use(Sentry.Handlers.requestHandler());
      server.use(Sentry.Handlers.tracingHandler()); // this one will enable the tracing
    })
    .register(require("./entity/audio/routes"));

  server.listen({ host: "0.0.0.0", port: 3000 }, function (err, address) {
    if (err) {
      server.log.error(err);
      process.exit(1);
    }
  });

  return server;
}

main();
