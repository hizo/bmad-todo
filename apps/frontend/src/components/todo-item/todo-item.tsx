import type { Todo } from "@bmad-todo/shared";
import { cn } from "@/lib/utils";

interface TodoItemProps {
  todo: Todo;
}

export function TodoItem({ todo }: TodoItemProps) {
  return (
    <div
      className={cn(
        "flex min-h-[48px] items-center rounded-lg bg-white px-3 py-3",
        todo.completed ? "text-[#A8A29E] line-through" : "text-[#292524]",
      )}
    >
      <span>{todo.text}</span>
    </div>
  );
}
