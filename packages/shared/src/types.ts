export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string; // ISO 8601
}

export interface ApiResponse<T> {
  data: T;
}

export interface ApiError {
  error: {
    code: string; // e.g., "VALIDATION_ERROR", "NOT_FOUND", "INTERNAL_ERROR"
    message: string;
  };
}
