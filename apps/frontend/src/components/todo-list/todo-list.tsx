import type { Todo } from "@bmad-todo/shared";
import { TodoItem } from "@/components/todo-item/todo-item";

interface TodoListProps {
  todos: Todo[];
}

export function TodoList({ todos }: TodoListProps) {
  if (todos.length === 0) {
    return <p className="text-center text-sm text-[#A8A29E]">No todos yet. Add one above!</p>;
  }

  return (
    <ul className="flex flex-col gap-4">
      {todos.map((todo) => (
        <li key={todo.id}>
          <TodoItem todo={todo} />
        </li>
      ))}
    </ul>
  );
}
