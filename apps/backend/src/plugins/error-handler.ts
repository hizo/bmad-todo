import type { FastifyError, FastifyInstance } from "fastify";
import fp from "fastify-plugin";

function errorHandlerPlugin(
  fastify: FastifyInstance,
  _opts: Record<string, unknown>,
  done: () => void,
) {
  fastify.setErrorHandler((error: FastifyError, _request, reply) => {
    const statusCode = error.statusCode ?? 500;

    let code = "INTERNAL_ERROR";
    if (statusCode === 400) code = "VALIDATION_ERROR";
    else if (statusCode === 404) code = "NOT_FOUND";

    fastify.log.error(error);

    reply.status(statusCode).send({
      error: {
        code,
        message: error.message,
      },
    });
  });

  done();
}

export const errorHandler = fp(errorHandlerPlugin, {
  name: "error-handler",
});
