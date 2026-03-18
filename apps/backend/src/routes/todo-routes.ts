import type { FastifyInstance } from "fastify";
import { createTodo, deleteTodo, getAllTodos, updateTodo } from "../db/queries.js";
import {
  apiErrorSchema,
  apiResponseSchema,
  todoIdParamsSchema,
  todoSchema,
  updateTodoBodySchema,
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

  fastify.patch(
    "/:id",
    {
      schema: {
        params: todoIdParamsSchema,
        body: updateTodoBodySchema,
        response: {
          200: apiResponseSchema(todoSchema),
          400: apiErrorSchema,
          404: apiErrorSchema,
          500: apiErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const { completed } = request.body as { completed: boolean };
      const todo = await updateTodo(id, completed);
      if (todo === null) {
        return reply
          .status(404)
          .send({ error: { code: "NOT_FOUND", message: "Todo not found" } });
      }
      return reply.status(200).send({ data: todo });
    },
  );

  fastify.delete(
    "/:id",
    {
      schema: {
        params: todoIdParamsSchema,
        response: {
          200: apiResponseSchema({
            type: "object",
            properties: { id: { type: "string" } },
            required: ["id"],
          }),
          400: apiErrorSchema,
          404: apiErrorSchema,
          500: apiErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const result = await deleteTodo(id);
      if (result === null) {
        return reply
          .status(404)
          .send({ error: { code: "NOT_FOUND", message: "Todo not found" } });
      }
      return reply.status(200).send({ data: { id: result.id } });
    },
  );
}

export { todoRoutes };
