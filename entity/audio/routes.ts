import AudioController from "./controllers";

const ROUTE = "/audio";

async function routes(fastify, options, done) {
  fastify.route({
    method: "POST",
    url: `${ROUTE}`,
    handler: AudioController.saveAudio,
  });
}

export default routes;
