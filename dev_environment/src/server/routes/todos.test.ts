import { defineRoutes } from ".";
import { IRouter } from "../../../../src/core/server";

const createMockContext = () => ({
  core: {
    opensearch: {
      client: {
        asCurrentUser: {
          indices: {
            exists: jest.fn(),
            create: jest.fn(),
          },
          create: jest.fn(),
          search: jest.fn(),
          get: jest.fn(),
          update: jest.fn(),
          delete: jest.fn(),
          exists: jest.fn(),
        },
      },
    },
  },
  logger: {
    error: jest.fn(),
  },
});

const createMockRequest = (body?: any, params?: any, query?: any) => ({
  body,
  params,
  query,
});

const createMockResponse = () => ({
  ok: jest.fn(),
  notFound: jest.fn(),
  internalError: jest.fn(),
});

describe('Todo API Tests', () => {
  let mockContext: any;
  let mockResponse: any;
  let mockClient: any;
  let routeHandlers: any = {};

  beforeEach(() => {
    mockContext = createMockContext();
    mockResponse = createMockResponse();
    mockClient = mockContext.core.opensearch.client.asCurrentUser;
    
    const router: IRouter = {
      get: jest.fn((path, handler) => {
        if (path.path === '/api/custom_plugin/todos') {
          routeHandlers.getTodos = handler;
        } else if (path.path === '/api/custom_plugin/todos/{id}/todo') {
          routeHandlers.getTodo = handler;
        }
      }),
      post: jest.fn((path, handler) => {
        if (path.path === '/api/custom_plugin/todos') {
          routeHandlers.createTodo = handler;
        }
      }),
      patch: jest.fn((path, handler) => {
        if (path.path === '/api/custom_plugin/todos/{id}/status') {
          routeHandlers.updateStatus = handler;
        }
      }),
      delete: jest.fn((path, handler) => {
        if (path.path === '/api/custom_plugin/todos/{id}/delete') {
          routeHandlers.deleteTodo = handler;
        }
      }),
    } as any;
    
    defineRoutes(router);
    jest.clearAllMocks();
    mockResponse = createMockResponse();
  });

  // ===== POST /api/custom_plugin/todos =====
  describe('POST /api/custom_plugin/todos', () => {
    test('should create todo successfully with all fields', async () => {
      const todoData = { title: 'Test todo', description: 'Test description' };
      const mockRequest = createMockRequest(todoData);
      
      mockClient.indices.exists.mockResolvedValue({ body: true });
      mockClient.create.mockResolvedValue({ body: { result: 'created' } });

      await routeHandlers.createTodo(mockContext, mockRequest, mockResponse);

      expect(mockClient.create).toHaveBeenCalledWith({
        index: 'todos',
        id: expect.any(String),
        body: expect.objectContaining({
          title: 'Test todo',
          description: 'Test description',
          status: 'planned',
          createdAt: expect.any(String),
        }),
      });
      expect(mockResponse.ok).toHaveBeenCalledWith({
        body: {
          success: true,
          data: expect.objectContaining({
            title: 'Test todo',
            description: 'Test description',
            status: 'planned',
          }),
        },
      });
    });

    test('should create todo without description', async () => {
      const todoData = { title: 'Test todo' };
      const mockRequest = createMockRequest(todoData);
      
      mockClient.indices.exists.mockResolvedValue({ body: true });
      mockClient.create.mockResolvedValue({ body: { result: 'created' } });

      await routeHandlers.createTodo(mockContext, mockRequest, mockResponse);

      expect(mockClient.create).toHaveBeenCalledWith({
        index: 'todos',
        id: expect.any(String),
        body: expect.objectContaining({
          title: 'Test todo',
          status: 'planned',
        }),
      });
      expect(mockResponse.ok).toHaveBeenCalled();
    });

    test('should create index if not exists', async () => {
      const todoData = { title: 'Test todo' };
      const mockRequest = createMockRequest(todoData);
      
      mockClient.indices.exists.mockResolvedValue({ body: false });
      mockClient.indices.create.mockResolvedValue({ body: { acknowledged: true } });
      mockClient.create.mockResolvedValue({ body: { result: 'created' } });

      await routeHandlers.createTodo(mockContext, mockRequest, mockResponse);

      expect(mockClient.indices.create).toHaveBeenCalledWith({ index: 'todos' });
      expect(mockClient.create).toHaveBeenCalled();
      expect(mockResponse.ok).toHaveBeenCalled();
    });

    test('should handle error when creating index', async () => {
      const todoData = { title: 'Test todo' };
      const mockRequest = createMockRequest(todoData);
      
      mockClient.indices.exists.mockResolvedValue({ body: false });
      mockClient.indices.create.mockRejectedValue(new Error('Index creation failed'));

      await routeHandlers.createTodo(mockContext, mockRequest, mockResponse);

      expect(mockResponse.internalError).toHaveBeenCalledWith({
        body: { message: 'Failed to create todo' },
      });
    });

    test('should handle error when creating document', async () => {
      const todoData = { title: 'Test todo' };
      const mockRequest = createMockRequest(todoData);
      
      mockClient.indices.exists.mockResolvedValue({ body: true });
      mockClient.create.mockRejectedValue(new Error('OpenSearch error'));

      await routeHandlers.createTodo(mockContext, mockRequest, mockResponse);

      expect(mockResponse.internalError).toHaveBeenCalledWith({
        body: { message: 'Failed to create todo' },
      });
    });
  });

  // ===== GET /api/custom_plugin/todos =====
  describe('GET /api/custom_plugin/todos', () => {
    test('should return todos with default pagination', async () => {
      const mockRequest = createMockRequest(null, null, {});
      const mockTodos = [
        { id: '1', title: 'Todo 1', status: 'planned' },
        { id: '2', title: 'Todo 2', status: 'completed' },
      ];
      
      mockClient.indices.exists.mockResolvedValue({ body: true });
      mockClient.search.mockResolvedValue({
        body: {
          hits: {
            total: { value: 2 },
            hits: mockTodos.map(todo => ({ _source: todo })),
          },
        },
      });

      await routeHandlers.getTodos(mockContext, mockRequest, mockResponse);

      expect(mockClient.search).toHaveBeenCalledWith({
        index: 'todos',
        body: expect.objectContaining({
          from: 0,
          size: 10,
          query: { match_all: {} },
          sort: [{ createdAt: { order: 'desc' } }],
        }),
      });
      expect(mockResponse.ok).toHaveBeenCalledWith({
        body: {
          success: true,
          data: mockTodos,
          pagination: {
            page: 1,
            limit: 10,
            total: 2,
            totalPages: 1,
          },
          search: null,
        },
      });
    });

    test('should return todos with custom pagination', async () => {
      const mockRequest = createMockRequest(null, null, { page: 2, limit: 5 });
      
      mockClient.indices.exists.mockResolvedValue({ body: true });
      mockClient.search.mockResolvedValue({
        body: {
          hits: {
            total: { value: 10 },
            hits: [],
          },
        },
      });

      await routeHandlers.getTodos(mockContext, mockRequest, mockResponse);

      expect(mockClient.search).toHaveBeenCalledWith({
        index: 'todos',
        body: expect.objectContaining({
          from: 5,
          size: 5,
        }),
      });
      expect(mockResponse.ok).toHaveBeenCalledWith({
        body: expect.objectContaining({
          pagination: {
            page: 2,
            limit: 5,
            total: 10,
            totalPages: 2,
          },
        }),
      });
    });

    test('should filter by status', async () => {
      const mockRequest = createMockRequest(null, null, { status: 'completed' });
      
      mockClient.indices.exists.mockResolvedValue({ body: true });
      mockClient.search.mockResolvedValue({
        body: {
          hits: {
            total: { value: 1 },
            hits: [{ _source: { id: '1', status: 'completed' } }],
          },
        },
      });

      await routeHandlers.getTodos(mockContext, mockRequest, mockResponse);

      expect(mockClient.search).toHaveBeenCalledWith({
        index: 'todos',
        body: expect.objectContaining({
          query: {
            bool: {
              must: [{ match_all: {} }],
              filter: [{ term: { status: 'completed' } }],
            },
          },
        }),
      });
    });

    test('should search by text', async () => {
      const mockRequest = createMockRequest(null, null, { search: 'PCI DSS' });
      
      mockClient.indices.exists.mockResolvedValue({ body: true });
      mockClient.search.mockResolvedValue({
        body: {
          hits: {
            total: { value: 1 },
            hits: [{ _source: { id: '1', title: 'PCI DSS Audit' } }],
          },
        },
      });

      await routeHandlers.getTodos(mockContext, mockRequest, mockResponse);

      expect(mockClient.search).toHaveBeenCalledWith({
        index: 'todos',
        body: expect.objectContaining({
          query: {
            multi_match: {
              query: 'PCI DSS',
              fields: ['title^2', 'description'],
              type: 'best_fields',
              fuzziness: 'AUTO',
            },
          },
        }),
      });
      expect(mockResponse.ok).toHaveBeenCalledWith({
        body: expect.objectContaining({
          search: { query: 'PCI DSS', results: 1 },
        }),
      });
    });

    test('should combine search and status filter', async () => {
      const mockRequest = createMockRequest(null, null, { search: 'audit', status: 'planned' });
      
      mockClient.indices.exists.mockResolvedValue({ body: true });
      mockClient.search.mockResolvedValue({
        body: {
          hits: {
            total: { value: 1 },
            hits: [{ _source: { id: '1', title: 'Security Audit', status: 'planned' } }],
          },
        },
      });

      await routeHandlers.getTodos(mockContext, mockRequest, mockResponse);

      expect(mockClient.search).toHaveBeenCalledWith({
        index: 'todos',
        body: expect.objectContaining({
          query: {
            bool: {
              must: [{
                multi_match: {
                  query: 'audit',
                  fields: ['title^2', 'description'],
                  type: 'best_fields',
                  fuzziness: 'AUTO',
                },
              }],
              filter: [{ term: { status: 'planned' } }],
            },
          },
        }),
      });
    });

    test('should return empty array when index not exists', async () => {
      const mockRequest = createMockRequest(null, null, {});
      
      mockClient.indices.exists.mockResolvedValue({ body: false });

      await routeHandlers.getTodos(mockContext, mockRequest, mockResponse);

      expect(mockClient.indices.exists).toHaveBeenCalledWith({ index: 'todos' });
      expect(mockClient.search).not.toHaveBeenCalled();
      expect(mockResponse.ok).toHaveBeenCalledWith({
        body: {
          success: true,
          data: [],
          pagination: {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0,
          },
        },
      });
    });

    test('should return empty array when index exists but has no documents', async () => {
      const mockRequest = createMockRequest(null, null, {});
      
      mockClient.indices.exists.mockResolvedValue({ body: true });
      mockClient.search.mockResolvedValue({
        body: {
          hits: {
            total: { value: 0 },
            hits: [],
          },
        },
      });

      await routeHandlers.getTodos(mockContext, mockRequest, mockResponse);

      expect(mockResponse.ok).toHaveBeenCalledWith({
        body: {
          success: true,
          data: [],
          pagination: {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0,
          },
          search: null,
        },
      });
    });

    test('should handle search errors', async () => {
      const mockRequest = createMockRequest(null, null, {});
      
      mockClient.indices.exists.mockResolvedValue({ body: true });
      mockClient.search.mockRejectedValue(new Error('Search failed'));

      await routeHandlers.getTodos(mockContext, mockRequest, mockResponse);

      expect(mockResponse.internalError).toHaveBeenCalledWith({
        body: { message: 'Failed to get todos' },
      });
    });
  });

  // ===== GET /api/custom_plugin/todos/{id}/todo =====
  describe('GET /api/custom_plugin/todos/{id}/todo', () => {
    test('should return specific todo', async () => {
      const mockRequest = createMockRequest(null, { id: 'test-id' });
      const mockTodo = { id: 'test-id', title: 'Test todo', status: 'planned' };
      
      mockClient.indices.exists.mockResolvedValue({ body: true });
      mockClient.get.mockResolvedValue({
        body: {
          found: true,
          _source: mockTodo,
        },
      });

      await routeHandlers.getTodo(mockContext, mockRequest, mockResponse);

      expect(mockClient.get).toHaveBeenCalledWith({
        index: 'todos',
        id: 'test-id',
      });
      expect(mockResponse.ok).toHaveBeenCalledWith({
        body: {
          success: true,
          body: mockTodo,
        },
      });
    });

    test('should return 404 when index not exists', async () => {
      const mockRequest = createMockRequest(null, { id: 'test-id' });
      
      mockClient.indices.exists.mockResolvedValue({ body: false });

      await routeHandlers.getTodo(mockContext, mockRequest, mockResponse);

      expect(mockClient.get).not.toHaveBeenCalled();
      expect(mockResponse.notFound).toHaveBeenCalledWith({
        body: { message: 'TO-DO not found' },
      });
    });

    test('should return 404 for non-existent todo', async () => {
      const mockRequest = createMockRequest(null, { id: 'non-existent' });
      
      mockClient.indices.exists.mockResolvedValue({ body: true });
      mockClient.get.mockResolvedValue({
        body: {
          found: false,
        },
      });

      await routeHandlers.getTodo(mockContext, mockRequest, mockResponse);

      expect(mockResponse.notFound).toHaveBeenCalledWith({
        body: { message: 'TO-DO not found' },
      });
    });

    test('should handle 404 error from OpenSearch', async () => {
      const mockRequest = createMockRequest(null, { id: 'test-id' });
      
      mockClient.indices.exists.mockResolvedValue({ body: true });
      mockClient.get.mockRejectedValue({ statusCode: 404 });

      await routeHandlers.getTodo(mockContext, mockRequest, mockResponse);

      expect(mockResponse.notFound).toHaveBeenCalledWith({
        body: { message: 'TO-DO not found.' },
      });
    });

    test('should handle generic errors', async () => {
      const mockRequest = createMockRequest(null, { id: 'test-id' });
      
      mockClient.indices.exists.mockResolvedValue({ body: true });
      mockClient.get.mockRejectedValue(new Error('OpenSearch error'));

      await routeHandlers.getTodo(mockContext, mockRequest, mockResponse);

      expect(mockResponse.internalError).toHaveBeenCalledWith({
        body: { message: 'Failed to get TO-DO' },
      });
    });
  });

  // ===== PATCH /api/custom_plugin/todos/{id}/status =====
  describe('PATCH /api/custom_plugin/todos/{id}/status', () => {
    test('should update status to completed successfully', async () => {
      const mockRequest = createMockRequest({ status: 'completed' }, { id: 'test-id' });
      const updatedTodo = { id: 'test-id', title: 'Test', status: 'completed' };
      
      mockClient.indices.exists.mockResolvedValue({ body: true });
      mockClient.exists.mockResolvedValue({ body: true });
      mockClient.update.mockResolvedValue({ body: { result: 'updated' } });
      mockClient.get.mockResolvedValue({
        body: { _source: updatedTodo },
      });

      await routeHandlers.updateStatus(mockContext, mockRequest, mockResponse);

      expect(mockClient.update).toHaveBeenCalledWith({
        index: 'todos',
        id: 'test-id',
        body: {
          doc: { status: 'completed' },
        },
      });
      expect(mockResponse.ok).toHaveBeenCalledWith({
        body: {
          success: true,
          data: updatedTodo,
        },
      });
    });

    test('should update status to planned successfully', async () => {
      const mockRequest = createMockRequest({ status: 'planned' }, { id: 'test-id' });
      const updatedTodo = { id: 'test-id', title: 'Test', status: 'planned' };
      
      mockClient.indices.exists.mockResolvedValue({ body: true });
      mockClient.exists.mockResolvedValue({ body: true });
      mockClient.update.mockResolvedValue({ body: { result: 'updated' } });
      mockClient.get.mockResolvedValue({
        body: { _source: updatedTodo },
      });

      await routeHandlers.updateStatus(mockContext, mockRequest, mockResponse);

      expect(mockClient.update).toHaveBeenCalledWith({
        index: 'todos',
        id: 'test-id',
        body: {
          doc: { status: 'planned' },
        },
      });
      expect(mockResponse.ok).toHaveBeenCalled();
    });

    test('should return 404 when index not exists', async () => {
      const mockRequest = createMockRequest({ status: 'completed' }, { id: 'test-id' });
      
      mockClient.indices.exists.mockResolvedValue({ body: false });

      await routeHandlers.updateStatus(mockContext, mockRequest, mockResponse);

      expect(mockClient.exists).not.toHaveBeenCalled();
      expect(mockClient.update).not.toHaveBeenCalled();
      expect(mockResponse.notFound).toHaveBeenCalledWith({
        body: { message: 'TO-DO not found' },
      });
    });

    test('should return 404 when document not exists', async () => {
      const mockRequest = createMockRequest({ status: 'completed' }, { id: 'non-existent' });
      
      mockClient.indices.exists.mockResolvedValue({ body: true });
      mockClient.exists.mockResolvedValue({ body: false });

      await routeHandlers.updateStatus(mockContext, mockRequest, mockResponse);

      expect(mockClient.update).not.toHaveBeenCalled();
      expect(mockResponse.notFound).toHaveBeenCalledWith({
        body: { message: 'TO-DO not found' },
      });
    });

    test('should handle 404 error from update', async () => {
      const mockRequest = createMockRequest({ status: 'completed' }, { id: 'test-id' });
      
      mockClient.indices.exists.mockResolvedValue({ body: true });
      mockClient.exists.mockResolvedValue({ body: true });
      mockClient.update.mockRejectedValue({ statusCode: 404 });

      await routeHandlers.updateStatus(mockContext, mockRequest, mockResponse);

      expect(mockResponse.notFound).toHaveBeenCalledWith({
        body: { message: 'TO-DO not found' },
      });
    });

    test('should handle generic update errors', async () => {
      const mockRequest = createMockRequest({ status: 'completed' }, { id: 'test-id' });
      
      mockClient.indices.exists.mockResolvedValue({ body: true });
      mockClient.exists.mockResolvedValue({ body: true });
      mockClient.update.mockRejectedValue(new Error('Update failed'));

      await routeHandlers.updateStatus(mockContext, mockRequest, mockResponse);

      expect(mockResponse.internalError).toHaveBeenCalledWith({
        body: { message: 'Failed to update todo status' },
      });
    });
  });

  // ===== DELETE /api/custom_plugin/todos/{id}/delete =====
  describe('DELETE /api/custom_plugin/todos/{id}/delete', () => {
    test('should delete todo successfully', async () => {
      const mockRequest = createMockRequest(null, { id: 'test-id' });
      
      mockClient.indices.exists.mockResolvedValue({ body: true });
      mockClient.delete.mockResolvedValue({
        body: { result: 'deleted' },
      });

      await routeHandlers.deleteTodo(mockContext, mockRequest, mockResponse);

      expect(mockClient.delete).toHaveBeenCalledWith({
        index: 'todos',
        id: 'test-id',
      });
      expect(mockResponse.ok).toHaveBeenCalledWith({
        body: {
          success: true,
          message: 'TO-DO deleted successfully',
          deletedId: 'test-id',
        },
      });
    });

    test('should return 404 when index not exists', async () => {
      const mockRequest = createMockRequest(null, { id: 'test-id' });
      
      mockClient.indices.exists.mockResolvedValue({ body: false });

      await routeHandlers.deleteTodo(mockContext, mockRequest, mockResponse);

      expect(mockClient.delete).not.toHaveBeenCalled();
      expect(mockResponse.notFound).toHaveBeenCalledWith({
        body: { message: 'TO-DO not found' },
      });
    });

    test('should return 404 for non-existent todo', async () => {
      const mockRequest = createMockRequest(null, { id: 'non-existent' });
      
      mockClient.indices.exists.mockResolvedValue({ body: true });
      mockClient.delete.mockRejectedValue({ statusCode: 404 });

      await routeHandlers.deleteTodo(mockContext, mockRequest, mockResponse);

      expect(mockResponse.notFound).toHaveBeenCalledWith({
        body: { message: 'TO-DO not found' },
      });
    });

    test('should handle generic delete errors', async () => {
      const mockRequest = createMockRequest(null, { id: 'test-id' });
      
      mockClient.indices.exists.mockResolvedValue({ body: true });
      mockClient.delete.mockRejectedValue(new Error('Delete failed'));

      await routeHandlers.deleteTodo(mockContext, mockRequest, mockResponse);

      expect(mockResponse.internalError).toHaveBeenCalledWith({
        body: { message: 'Failed to delete todo' },
      });
    });
  });
});