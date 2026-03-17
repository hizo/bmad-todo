import { useState } from "react";
import { Input } from "@/components/ui/input";

interface AddTodoFormProps {
  onSubmit: (text: string) => Promise<unknown>;
  isPending?: boolean;
}

export function AddTodoForm({ onSubmit, isPending = false }: AddTodoFormProps) {
  const [text, setText] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    onSubmit(trimmed).then(() => setText(""), () => {});
  }

  return (
    <form onSubmit={handleSubmit}>
      <Input
        aria-label="New todo"
        placeholder="What needs to be done?"
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={isPending}
        autoFocus
        className="focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
      />
    </form>
  );
}
