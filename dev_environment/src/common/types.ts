export interface CreateTodoRequest {
  title: string;
  description?: string;
}

export interface Todo {
  id: string;
  title: string;
  description?: string;
  status: 'planned' | 'completed';
  createdAt: string;
}
