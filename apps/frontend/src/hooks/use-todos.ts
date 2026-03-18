import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import type { Todo } from "@bmad-todo/shared";
import { createTodo, deleteTodo, getTodos, toggleTodo } from "@/api/todos";

export function useTodos() {
  const queryClient = useQueryClient();

  const { data: todos } = useSuspenseQuery({
    queryKey: ["todos"],
    queryFn: getTodos,
  });

  const createMutation = useMutation({
    mutationFn: createTodo,
    onMutate: async (text: string) => {
      await queryClient.cancelQueries({ queryKey: ["todos"] });
      const previous = queryClient.getQueryData<Todo[]>(["todos"]);
      queryClient.setQueryData<Todo[]>(["todos"], (old = []) => [
        ...old,
        {
          id: `temp-${Date.now()}`,
          text,
          completed: false,
          createdAt: new Date().toISOString(),
        },
      ]);
      return { previous };
    },
    onError: (_err, _text, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["todos"], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
      toggleTodo(id, completed),
    onMutate: async ({ id, completed }) => {
      await queryClient.cancelQueries({ queryKey: ["todos"] });
      const previous = queryClient.getQueryData<Todo[]>(["todos"]);
      queryClient.setQueryData<Todo[]>(["todos"], (old = []) =>
        old.map((t) => (t.id === id ? { ...t, completed } : t)),
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["todos"], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTodo(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ["todos"] });
      const previous = queryClient.getQueryData<Todo[]>(["todos"]);
      queryClient.setQueryData<Todo[]>(["todos"], (old = []) =>
        old.filter((t) => t.id !== id),
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["todos"], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
    },
  });

  return { todos, createMutation, toggleMutation, deleteMutation };
}
