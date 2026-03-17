import { Suspense, Component, useCallback, useRef, useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AddTodoForm } from "@/components/add-todo-form/add-todo-form";
import { LoadingState } from "@/components/loading-state/loading-state";
import { TodoList } from "@/components/todo-list/todo-list";
import { useTodos } from "@/hooks/use-todos";

const queryClient = new QueryClient();

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, message: "" };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : "Something went wrong.",
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <p className="text-sm text-destructive">Error: {this.state.message}</p>
      );
    }
    return this.props.children;
  }
}

function TodoApp() {
  const { todos, createMutation, toggleMutation } = useTodos();
  const [announcement, setAnnouncement] = useState("");
  const announcementTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleToggle = useCallback(
    (id: string, completed: boolean) => {
      toggleMutation.mutate(
        { id, completed },
        {
          onSuccess: () => {
            if (announcementTimer.current) clearTimeout(announcementTimer.current);
            setAnnouncement("");
            announcementTimer.current = setTimeout(() => {
              setAnnouncement(completed ? "Task completed" : "Task restored");
            }, 50);
          },
        },
      );
    },
    [toggleMutation],
  );

  return (
    <>
      <span role="status" aria-live="polite" className="sr-only">
        {announcement}
      </span>
      <AddTodoForm
        onSubmit={(text) => createMutation.mutateAsync(text)}
        isPending={createMutation.isPending}
      />
      <div className="mt-4">
        <TodoList todos={todos} onToggle={handleToggle} />
      </div>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-[#FFFBF5] px-4 py-6 md:px-6">
        <main className="mx-auto w-full max-w-[640px]">
          <h1 className="mb-6 text-2xl font-semibold text-[#292524]">BMad Todo</h1>
          <ErrorBoundary>
            <Suspense fallback={<LoadingState />}>
              <TodoApp />
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
    </QueryClientProvider>
  );
}

export default App;
