import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";

interface AddTodoFormProps {
  onSubmit: (text: string) => Promise<unknown>;
  isPending?: boolean;
  error?: string | null;
}

export function AddTodoForm({ onSubmit, isPending = false, error }: AddTodoFormProps) {
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (error) {
      inputRef.current?.focus();
    }
  }, [error]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    onSubmit(trimmed).then(
      () => setText(""),
      () => {},
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <Input
        ref={inputRef}
        aria-label="New todo"
        placeholder="What needs to be done?"
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={isPending}
        autoFocus
        className="focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
      />
      {error && (
        <p aria-live="polite" className="mt-2 text-sm text-[#EF4444]">
          {error}
        </p>
      )}
    </form>
  );
}
