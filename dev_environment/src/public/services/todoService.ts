import { HttpStart } from '../../../../src/core/public';
import {
  CreateTodoRequest,
  CreateTodoResponse,
  DeleteTodoResponse,
  GetTodosResponse,
  TodoFilters,
  UpdateTodoResponse,
} from '../types/todo.types';

const BASE_PATH = '/api/custom_plugin/todos';

// method to obtain all todos
export const getTodos = async (
  http: HttpStart,
  filters: TodoFilters = {}
): Promise<GetTodosResponse> => {
  const query: Record<string, any> = {};

  if (filters.page) query.page = filters.page;
  if (filters.limit) query.limit = filters.limit;
  if (filters.status) query.status = filters.status;
  if (filters.search) query.search = filters.search;

  return await http.get(BASE_PATH, { query });
};

// create a new todo
export const createTodo = async (
  http: HttpStart,
  todo: CreateTodoRequest
): Promise<CreateTodoResponse> => {
  return await http.post(BASE_PATH, {
    body: JSON.stringify(todo),
  });
};

// update status
export const updateTodoStatus = async (
  http: HttpStart,
  id: string,
  status: 'planned' | 'completed'
): Promise<UpdateTodoResponse> => {
  return await http.patch(`${BASE_PATH}/${id}/status`, {
    body: JSON.stringify({ status }),
  });
};

// delete todo
export const deleteTodo = async (http: HttpStart, id: string): Promise<DeleteTodoResponse> => {
  return await http.delete(`${BASE_PATH}/${id}/delete`);
};
