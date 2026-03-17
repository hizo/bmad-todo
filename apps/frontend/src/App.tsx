import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <main>
        <h1>BMad Todo</h1>
        <p>App shell ready. Components coming in Story 1.3.</p>
      </main>
    </QueryClientProvider>
  );
}

export default App;
