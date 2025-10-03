import { renderHook, act } from '@testing-library/react-hooks';
import { useTodos } from './useTodos';
import * as todoService from '../services/todoService';

jest.mock('../services/todoService');

const mockHttp = {} as any;
const mockNotifications = {
  toasts: {
    addSuccess: jest.fn(),
    addDanger: jest.fn(),
  },
} as any;

const mockTodosResponse = {
  success: true,
  data: [
    { id: '1', title: 'Test Todo', description: 'Test', status: 'planned', createdAt: '2024-01-01' },
  ],
  pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
  stats: { total: 1, completed: 0, planned: 1, completedPercentage: 0, plannedPercentage: 100 },
};

describe('useTodos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should load todos on mount', async () => {
    (todoService.getTodos as jest.Mock).mockResolvedValue(mockTodosResponse);

    const { result, waitForNextUpdate } = renderHook(() =>
      useTodos({ http: mockHttp, notifications: mockNotifications })
    );

    expect(result.current.loading).toBe(true);

    await waitForNextUpdate();

    expect(result.current.todos).toHaveLength(1);
    expect(result.current.todos[0].title).toBe('Test Todo');
    expect(result.current.loading).toBe(false);
  });

  test('should create todo successfully', async () => {
    (todoService.getTodos as jest.Mock).mockResolvedValue(mockTodosResponse);
    (todoService.createTodo as jest.Mock).mockResolvedValue({
      success: true,
      data: { id: '2', title: 'New Todo', status: 'planned', createdAt: '2024-01-02' },
      stats: { total: 2, completed: 0, planned: 2, completedPercentage: 0, plannedPercentage: 100 },
    });

    const { result, waitForNextUpdate } = renderHook(() =>
      useTodos({ http: mockHttp, notifications: mockNotifications })
    );

    await waitForNextUpdate();

    await act(async () => {
      await result.current.createTodo({ title: 'New Todo' });
    });

    expect(todoService.createTodo).toHaveBeenCalled();
    expect(mockNotifications.toasts.addSuccess).toHaveBeenCalled();
  });

  test('should update todo status', async () => {
    (todoService.getTodos as jest.Mock).mockResolvedValue(mockTodosResponse);
    (todoService.updateTodoStatus as jest.Mock).mockResolvedValue({
      success: true,
      data: { id: '1', title: 'Test Todo', status: 'completed', createdAt: '2024-01-01' },
      stats: { total: 1, completed: 1, planned: 0, completedPercentage: 100, plannedPercentage: 0 },
    });

    const { result, waitForNextUpdate } = renderHook(() =>
      useTodos({ http: mockHttp, notifications: mockNotifications })
    );

    await waitForNextUpdate();

    await act(async () => {
      await result.current.updateStatus('1', 'completed');
    });

    expect(todoService.updateTodoStatus).toHaveBeenCalledWith(mockHttp, '1', 'completed');
    expect(mockNotifications.toasts.addSuccess).toHaveBeenCalled();
  });

  test('should delete todo', async () => {
    (todoService.getTodos as jest.Mock).mockResolvedValue(mockTodosResponse);
    (todoService.deleteTodo as jest.Mock).mockResolvedValue({
      success: true,
      message: 'Deleted',
      deletedId: '1',
      stats: { total: 0, completed: 0, planned: 0, completedPercentage: 0, plannedPercentage: 0 },
    });

    const { result, waitForNextUpdate } = renderHook(() =>
      useTodos({ http: mockHttp, notifications: mockNotifications })
    );

    await waitForNextUpdate();

    await act(async () => {
      await result.current.deleteTodo('1');
    });

    expect(todoService.deleteTodo).toHaveBeenCalledWith(mockHttp, '1');
    expect(mockNotifications.toasts.addSuccess).toHaveBeenCalled();
  });
});