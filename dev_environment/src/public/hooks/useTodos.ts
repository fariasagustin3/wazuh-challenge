import { useState, useEffect } from 'react';
import { HttpStart, NotificationsStart } from '../../../../src/core/public';
import {
  Todo,
  TodoFilters,
  PaginationInfo,
  CreateTodoRequest,
  TodoStats,
} from '../types/todo.types';
import * as todoService from '../services/todoService';

interface UseTodosProps {
  http: HttpStart;
  notifications: NotificationsStart;
}

export const useTodos = ({ http, notifications }: UseTodosProps) => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState<TodoFilters>({
    page: 1,
    limit: 10,
  });
  const [stats, setStats] = useState<TodoStats>({
    total: 0,
    completed: 0,
    planned: 0,
    completedPercentage: 0,
    plannedPercentage: 0,
  });

  const loadTodos = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await todoService.getTodos(http, filters);
      setTodos(response.data);
      setPagination(response.pagination);
      setStats(response.stats);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load TO-DOs';
      setError(errorMessage);
      notifications.toasts.addDanger({
        title: 'Error',
        text: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const createTodo = async (todo: CreateTodoRequest): Promise<boolean> => {
    try {
      const response = await todoService.createTodo(http, todo);

      if (response.success) {
        notifications.toasts.addSuccess({
          title: 'Success',
          text: 'TO-DO created successfully',
        });

        setTodos((prevTodos) => [response.data, ...prevTodos]);
        setPagination((prev) => ({ ...prev, total: prev.total + 1 }));
        setStats(response.stats);

        return true;
      }

      await loadTodos();
      return false;
    } catch (err: any) {
      await loadTodos();
      const errorMessage = err.message || 'Failed to create TO-DO';
      notifications.toasts.addDanger({
        title: 'Error',
        text: errorMessage,
      });
      return false;
    }
  };

  const updateStatus = async (id: string, status: 'planned' | 'completed'): Promise<boolean> => {
    setTodos((prevTodos) => prevTodos.map((todo) => (todo.id === id ? { ...todo, status } : todo)));

    try {
      const response = await todoService.updateTodoStatus(http, id, status);
      if (response.success) {
        notifications.toasts.addSuccess({
          title: 'Success',
          text: `TO-DO marked as ${status === 'completed' ? 'completed' : 'planned'}`,
        });

        setStats(response.stats);

        return true;
      }

      await loadTodos();
      return false;
    } catch (err: any) {
      await loadTodos();
      const errorMessage = err.message || 'Failed to update TO-DO';
      notifications.toasts.addDanger({
        title: 'Error',
        text: errorMessage,
      });
      return false;
    }
  };

  const deleteTodo = async (id: string): Promise<boolean> => {
    setTodos((prevTodos) => prevTodos.filter((todo) => todo.id !== id));
    setPagination((prev) => ({ ...prev, total: prev.total - 1 }));

    try {
      const response = await todoService.deleteTodo(http, id);

      if (response.success) {
        notifications.toasts.addSuccess({
          title: 'Success',
          text: 'TO-DO deleted successfully',
        });

        setStats(response.stats);

        return true;
      }

      await loadTodos();
      return false;
    } catch (err: any) {
      await loadTodos();
      const errorMessage = err.message || 'Failed to delete TO-DO';
      notifications.toasts.addDanger({
        title: 'Error',
        text: errorMessage,
      });
      return false;
    }
  };

  const updateFilters = (newFilters: Partial<TodoFilters>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      page: newFilters.page !== undefined ? newFilters.page : 1,
    }));
  };

  useEffect(() => {
    loadTodos();
  }, [filters]);

  return {
    todos,
    loading,
    error,
    pagination,
    filters,
    stats,
    loadTodos,
    createTodo,
    updateStatus,
    deleteTodo,
    updateFilters,
  };
};
