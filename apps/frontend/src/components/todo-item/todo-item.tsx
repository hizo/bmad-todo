import type { Todo } from "@bmad-todo/shared";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
  error?: string | null;
  onRetry?: () => void;
}

export function TodoItem({ todo, onToggle, onDelete, error, onRetry }: TodoItemProps) {
  return (
    <div className="flex flex-col gap-1 rounded-lg bg-white px-3 py-3">
      <div className="flex min-h-[48px] items-center gap-3">
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
            "flex-1 select-none transition-all duration-200 motion-reduce:transition-none",
            todo.completed ? "text-[#78716C] line-through" : "text-[#292524]",
          )}
        >
          {todo.text}
        </span>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Delete ${todo.text}`}
          onClick={() => onDelete(todo.id)}
          className="size-11 shrink-0 text-stone-400 hover:text-stone-600 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          <X />
        </Button>
      </div>
      {error && (
        <div aria-live="polite" className="flex items-center gap-2 pl-8 text-sm text-[#EF4444]">
          <span>{error}</span>
          {onRetry && (
            <Button
              variant="link"
              size="sm"
              onClick={onRetry}
              className="h-auto p-0 text-[#EF4444] underline hover:no-underline"
            >
              Tap to retry
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
