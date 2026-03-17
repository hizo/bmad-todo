import type { FastifyInstance } from "fastify";
import { createTodo, getAllTodos } from "../db/queries.js";
import {
  apiErrorSchema,
  apiResponseSchema,
  todoSchema,
} from "../schemas/todo-schemas.js";

const createTodoBodySchema = {
  type: "object",
  properties: {
    text: { type: "string", minLength: 1, maxLength: 500, pattern: "\\S" },
  },
  required: ["text"],
} as const;

async function todoRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post(
    "/",
    {
      schema: {
        body: createTodoBodySchema,
        response: {
          201: apiResponseSchema(todoSchema),
          400: apiErrorSchema,
          500: apiErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const { text } = request.body as { text: string };
      const todo = await createTodo(text);
      return reply.status(201).send({ data: todo });
    },
  );

  fastify.get(
    "/",
    {
      schema: {
        response: {
          200: apiResponseSchema({ type: "array", items: todoSchema }),
          500: apiErrorSchema,
        },
      },
    },
    async (_request, reply) => {
      const todos = await getAllTodos();
      return reply.status(200).send({ data: todos });
    },
  );
}

export { todoRoutes };
