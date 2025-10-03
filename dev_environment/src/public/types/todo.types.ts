
import { Todo, CreateTodoRequest } from '../../common/types';

export type { Todo, CreateTodoRequest } from '../../common/types';

export interface TodoFilters {
  page?: number;
  limit?: number;
  status?: 'planned' | 'completed';
  search?: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface SearchInfo {
  query: string;
  results: number;
}

export interface GetTodosResponse {
  success: boolean;
  data: Todo[];
  pagination: PaginationInfo;
  search?: SearchInfo | null;
}

export interface CreateTodoResponse {
  success: boolean;
  data: Todo;
}

export interface UpdateTodoResponse {
  success: boolean;
  data: Todo;
}

export interface DeleteTodoResponse {
  success: boolean;
  message: string;
  deletedId: string;
}
