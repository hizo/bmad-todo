import type { Todo } from "@bmad-todo/shared";
import { TodoItem } from "@/components/todo-item/todo-item";
import { EmptyState } from "@/components/empty-state/empty-state";

interface TodoItemError {
  message: string;
  retry: () => void;
}

interface TodoListProps {
  todos: Todo[];
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
  itemErrors?: Record<string, TodoItemError>;
}

export function TodoList({ todos, onToggle, onDelete, itemErrors }: TodoListProps) {
  if (todos.length === 0) {
    return <EmptyState />;
  }

  return (
    <ul className="flex flex-col gap-4">
      {todos.map((todo) => {
        const err = itemErrors?.[todo.id];
        return (
          <li key={todo.id}>
            <TodoItem
              todo={todo}
              onToggle={onToggle}
              onDelete={onDelete}
              error={err?.message}
              onRetry={err?.retry}
            />
          </li>
        );
      })}
    </ul>
  );
}
