import type { Todo } from "@bmad-todo/shared";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string, completed: boolean) => void;
}

export function TodoItem({ todo, onToggle }: TodoItemProps) {
  return (
    <label className="flex min-h-[48px] cursor-pointer items-center gap-3 rounded-lg bg-white px-3 py-3">
      <Checkbox
        aria-labelledby={`todo-label-${todo.id}`}
        checked={todo.completed}
        onCheckedChange={(checked) => {
          if (typeof checked === "boolean") onToggle(todo.id, checked);
        }}
      />
      <span
        id={`todo-label-${todo.id}`}
        className={cn(
          "select-none transition-all duration-200 motion-reduce:transition-none",
          todo.completed ? "text-[#78716C] line-through" : "text-[#292524]",
        )}
      >
        {todo.text}
      </span>
    </label>
  );
}
