export const todoSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    text: { type: "string" },
    completed: { type: "boolean" },
    createdAt: { type: "string", format: "date-time" },
  },
  required: ["id", "text", "completed", "createdAt"],
} as const;

export const apiResponseSchema = (itemSchema: Record<string, unknown>) => ({
  type: "object",
  properties: {
    data: itemSchema,
  },
  required: ["data"],
});

export const apiErrorSchema = {
  type: "object",
  properties: {
    error: {
      type: "object",
      properties: {
        code: { type: "string" },
        message: { type: "string" },
      },
      required: ["code", "message"],
    },
  },
  required: ["error"],
} as const;
