import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createTodo, deleteTodo, getTodos, toggleTodo } from "@/api/todos";

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

  const toggleMutation = useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
      toggleTodo(id, completed),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTodo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
    },
  });

  return { todos, createMutation, toggleMutation, deleteMutation };
}
