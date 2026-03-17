import type { Todo } from "@bmad-todo/shared";
import { TodoItem } from "@/components/todo-item/todo-item";

interface TodoListProps {
  todos: Todo[];
  onToggle: (id: string, completed: boolean) => void;
}

export function TodoList({ todos, onToggle }: TodoListProps) {
  if (todos.length === 0) {
    return <p className="text-center text-sm text-muted-foreground">No todos yet. Add one above!</p>;
  }

  return (
    <ul className="flex flex-col gap-4">
      {todos.map((todo) => (
        <li key={todo.id}>
          <TodoItem todo={todo} onToggle={onToggle} />
        </li>
      ))}
    </ul>
  );
}
