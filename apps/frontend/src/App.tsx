import { Suspense, Component, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AddTodoForm } from "@/components/add-todo-form/add-todo-form";
import { ErrorState } from "@/components/error-state/error-state";
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

  handleRetry = () => {
    this.setState({ hasError: false, message: "" });
    queryClient.resetQueries();
  };

  render() {
    if (this.state.hasError) {
      return <ErrorState onRetry={this.handleRetry} />;
    }
    return this.props.children;
  }
}

function TodoApp() {
  const { todos, createMutation, toggleMutation, deleteMutation } = useTodos();
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

  const handleDelete = useCallback(
    (id: string) => {
      if (deleteMutation.isPending) return;
      deleteMutation.mutate(id, {
        onSuccess: () => {
          if (announcementTimer.current) clearTimeout(announcementTimer.current);
          setAnnouncement("");
          announcementTimer.current = setTimeout(() => {
            setAnnouncement("Task deleted");
          }, 50);
        },
      });
    },
    [deleteMutation],
  );

  useEffect(() => {
    return () => {
      if (announcementTimer.current) clearTimeout(announcementTimer.current);
    };
  }, []);

  const itemErrors = useMemo(() => {
    const errors: Record<string, { message: string; retry: () => void }> = {};
    if (toggleMutation.isError && toggleMutation.variables) {
      const { id, completed } = toggleMutation.variables;
      errors[id] = {
        message: "Couldn't save",
        retry: () => toggleMutation.mutate({ id, completed }),
      };
    }
    if (deleteMutation.isError && deleteMutation.variables) {
      const id = deleteMutation.variables;
      errors[id] = {
        message: "Couldn't save",
        retry: () => deleteMutation.mutate(id),
      };
    }
    return errors;
  }, [toggleMutation, deleteMutation]);

  const createError = createMutation.isError ? "Couldn't save — press Enter to try again" : null;

  return (
    <>
      <span role="status" aria-live="polite" className="sr-only">
        {announcement}
      </span>
      <AddTodoForm
        onSubmit={(text) => createMutation.mutateAsync(text)}
        isPending={createMutation.isPending}
        error={createError}
      />
      <div className="mt-4">
        <TodoList todos={todos} onToggle={handleToggle} onDelete={handleDelete} itemErrors={itemErrors} />
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
