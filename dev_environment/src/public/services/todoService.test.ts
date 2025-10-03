import * as todoService from './todoService';

describe('todoService', () => {
  const mockHttp = {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getTodos', () => {
    test('should call http.get with correct path and no filters', async () => {
      const mockResponse = {
        success: true,
        data: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
        stats: { total: 0, completed: 0, planned: 0, completedPercentage: 0, plannedPercentage: 0 },
      };
      mockHttp.get.mockResolvedValue(mockResponse);

      const result = await todoService.getTodos(mockHttp, {});

      expect(mockHttp.get).toHaveBeenCalledWith('/api/custom_plugin/todos', { query: {} });
      expect(result).toEqual(mockResponse);
    });

    test('should call http.get with filters', async () => {
      const mockResponse = {
        success: true,
        data: [],
        pagination: { page: 2, limit: 20, total: 0, totalPages: 0 },
        stats: { total: 0, completed: 0, planned: 0, completedPercentage: 0, plannedPercentage: 0 },
      };
      mockHttp.get.mockResolvedValue(mockResponse);

      await todoService.getTodos(mockHttp, {
        page: 2,
        limit: 20,
        status: 'completed',
        search: 'test',
      });

      expect(mockHttp.get).toHaveBeenCalledWith('/api/custom_plugin/todos', {
        query: { page: 2, limit: 20, status: 'completed', search: 'test' },
      });
    });
  });

  describe('createTodo', () => {
    test('should call http.post with correct data', async () => {
      const todoData = { title: 'New Todo', description: 'Description' };
      const mockResponse = {
        success: true,
        data: { id: '1', ...todoData, status: 'planned', createdAt: '2024-01-01' },
        stats: {
          total: 1,
          completed: 0,
          planned: 1,
          completedPercentage: 0,
          plannedPercentage: 100,
        },
      };
      mockHttp.post.mockResolvedValue(mockResponse);

      const result = await todoService.createTodo(mockHttp, todoData);

      expect(mockHttp.post).toHaveBeenCalledWith('/api/custom_plugin/todos', {
        body: JSON.stringify(todoData),
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('updateTodoStatus', () => {
    test('should call http.patch with correct id and status', async () => {
      const mockResponse = {
        success: true,
        data: { id: '1', title: 'Todo', status: 'completed', createdAt: '2024-01-01' },
        stats: {
          total: 1,
          completed: 1,
          planned: 0,
          completedPercentage: 100,
          plannedPercentage: 0,
        },
      };
      mockHttp.patch.mockResolvedValue(mockResponse);

      const result = await todoService.updateTodoStatus(mockHttp, '1', 'completed');

      expect(mockHttp.patch).toHaveBeenCalledWith('/api/custom_plugin/todos/1/status', {
        body: JSON.stringify({ status: 'completed' }),
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('deleteTodo', () => {
    test('should call http.delete with correct id', async () => {
      const mockResponse = {
        success: true,
        message: 'Deleted',
        deletedId: '1',
        stats: { total: 0, completed: 0, planned: 0, completedPercentage: 0, plannedPercentage: 0 },
      };
      mockHttp.delete.mockResolvedValue(mockResponse);

      const result = await todoService.deleteTodo(mockHttp, '1');

      expect(mockHttp.delete).toHaveBeenCalledWith('/api/custom_plugin/todos/1/delete');
      expect(result).toEqual(mockResponse);
    });
  });
});
