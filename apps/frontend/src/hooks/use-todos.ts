import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createTodo, getTodos } from "@/api/todos";

export function useTodos() {
  const queryClient = useQueryClient();

  const { data: todos } = useSuspenseQuery({
    queryKey: ["todos"],
    queryFn: getTodos,
  });

  const createMutation = useMutation({
    mutationFn: createTodo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
    },
  });

  return { todos, createMutation };
}
