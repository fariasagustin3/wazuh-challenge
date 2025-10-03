import { schema } from '@osd/config-schema';
import { IRouter } from '../../../../src/core/server';
import { Todo } from '../../common/types';

const INDEX_NAME = 'todos';

async function calculateStats(client: any): Promise<any> {
  try {
    const indexExists = await client.indices.exists({
      index: INDEX_NAME,
    });

    if (!indexExists.body) {
      return {
        total: 0,
        completed: 0,
        planned: 0,
        completedPercentage: 0,
        plannedPercentage: 0,
      };
    }

    const statsResponse = await client.search({
      index: INDEX_NAME,
      body: {
        size: 0,
        aggs: {
          status_count: {
            terms: {
              field: 'status.keyword',
              size: 10,
            },
          },
        },
      },
    });

    const statusBuckets = statsResponse.body.aggregations?.status_count?.buckets || [];
    let completedCount = 0;
    let plannedCount = 0;

    statusBuckets.forEach((bucket: any) => {
      if (bucket.key === 'completed') {
        completedCount = bucket.doc_count;
      } else if (bucket.key === 'planned') {
        plannedCount = bucket.doc_count;
      }
    });

    const total = completedCount + plannedCount;
    const completedPercentage =
      total > 0 ? Math.round((completedCount / total) * 100 * 10) / 10 : 0;
    const plannedPercentage = total > 0 ? Math.round((plannedCount / total) * 100 * 10) / 10 : 0;

    return {
      total,
      completed: completedCount,
      planned: plannedCount,
      completedPercentage,
      plannedPercentage,
    };
  } catch (error) {
    return {
      total: 0,
      completed: 0,
      planned: 0,
      completedPercentage: 0,
      plannedPercentage: 0,
    };
  }
}

export function defineRoutes(router: IRouter) {
  // Example route
  router.get(
    {
      path: '/api/custom_plugin/example',
      validate: false,
    },
    async (context, request, response) => {
      return response.ok({
        body: {
          time: new Date().toISOString(),
        },
      });
    }
  );

  // Create TODO
  router.post(
    {
      path: '/api/custom_plugin/todos',
      validate: {
        body: schema.object({
          title: schema.string(),
          description: schema.maybe(schema.string()),
        }),
      },
    },
    async (context, request, response) => {
      try {
        const { title, description } = request.body;
        const id = require('crypto').randomUUID();

        const todo: Todo = {
          id,
          title,
          description,
          status: 'planned',
          createdAt: new Date().toISOString(),
        };

        const indexExists = await context.core.opensearch.client.asCurrentUser.indices.exists({
          index: INDEX_NAME,
        });

        if (!indexExists.body) {
          await context.core.opensearch.client.asCurrentUser.indices.create({
            index: INDEX_NAME,
          });
        }

        await context.core.opensearch.client.asCurrentUser.create({
          index: INDEX_NAME,
          id: id,
          body: todo,
          refresh: true,
        });

        const stats = await calculateStats(context.core.opensearch.client.asCurrentUser);

        return response.ok({
          body: {
            success: true,
            data: todo,
            stats,
          },
        });
      } catch (error: any) {
        console.log(error);
        return response.internalError({
          body: {
            message: 'Failed to create todo',
          },
        });
      }
    }
  );

  // Get all TODOs with search, filters, and stats
  router.get(
    {
      path: '/api/custom_plugin/todos',
      validate: {
        query: schema.object({
          page: schema.maybe(schema.number({ min: 1 })),
          limit: schema.maybe(schema.number({ min: 1, max: 100 })),
          status: schema.maybe(
            schema.oneOf([schema.literal('planned'), schema.literal('completed')])
          ),
          search: schema.maybe(schema.string({ minLength: 1 })),
        }),
      },
    },
    async (context, request, response) => {
      try {
        const page = request.query.page || 1;
        const limit = request.query.limit || 10;
        const status = request.query.status;
        const search = request.query.search;
        const from = (page - 1) * limit;

        const indexExists = await context.core.opensearch.client.asCurrentUser.indices.exists({
          index: INDEX_NAME,
        });

        if (!indexExists.body) {
          return response.ok({
            body: {
              success: true,
              data: [],
              pagination: {
                page,
                limit,
                total: 0,
                totalPages: 0,
              },
              stats: {
                total: 0,
                completed: 0,
                planned: 0,
                completedPercentage: 0,
                plannedPercentage: 0,
              },
            },
          });
        }

        let searchBody: any = {
          query: {},
          sort: [{ createdAt: { order: 'desc' } }],
          from,
          size: limit,
          aggs: {
            status_count: {
              terms: {
                field: 'status.keyword',
                size: 10,
              },
            },
          },
        };

        let mainQuery: any = {};

        if (search) {
          mainQuery = {
            multi_match: {
              query: search,
              fields: ['title^2', 'description'],
              type: 'best_fields',
              fuzziness: 'AUTO',
            },
          };
        } else {
          mainQuery = {
            match_all: {},
          };
        }

        if (status) {
          searchBody.query = {
            bool: {
              must: [mainQuery],
              filter: [
                {
                  term: {
                    status: status,
                  },
                },
              ],
            },
          };
        } else {
          searchBody.query = mainQuery;
        }

        const searchResponse = await context.core.opensearch.client.asCurrentUser.search({
          index: INDEX_NAME,
          body: searchBody,
        });

        const totalHits = searchResponse.body.hits.total.value;
        const totalPages = Math.ceil(totalHits / limit);
        const todos: Todo[] = searchResponse.body.hits.hits.map((hit: any) => hit._source);

        const statusBuckets = searchResponse.body.aggregations?.status_count?.buckets || [];
        let completedCount = 0;
        let plannedCount = 0;

        statusBuckets.forEach((bucket: any) => {
          if (bucket.key === 'completed') {
            completedCount = bucket.doc_count;
          } else if (bucket.key === 'planned') {
            plannedCount = bucket.doc_count;
          }
        });

        const total = completedCount + plannedCount;
        const completedPercentage =
          total > 0 ? Math.round((completedCount / total) * 100 * 10) / 10 : 0;
        const plannedPercentage =
          total > 0 ? Math.round((plannedCount / total) * 100 * 10) / 10 : 0;

        return response.ok({
          body: {
            success: true,
            data: todos,
            pagination: {
              page,
              limit,
              total: totalHits,
              totalPages,
            },
            search: search ? { query: search, results: totalHits } : null,
            stats: {
              total,
              completed: completedCount,
              planned: plannedCount,
              completedPercentage,
              plannedPercentage,
            },
          },
        });
      } catch (error: any) {
        return response.internalError({
          body: {
            message: 'Failed to get todos',
          },
        });
      }
    }
  );

  // Get single TODO
  router.get(
    {
      path: '/api/custom_plugin/todos/{id}/todo',
      validate: {
        params: schema.object({
          id: schema.string(),
        }),
      },
    },
    async (context, request, response) => {
      try {
        const { id } = request.params;

        const indexExists = await context.core.opensearch.client.asCurrentUser.indices.exists({
          index: INDEX_NAME,
        });

        if (!indexExists.body) {
          return response.notFound({
            body: {
              message: 'TO-DO not found',
            },
          });
        }

        const getResponse = await context.core.opensearch.client.asCurrentUser.get({
          index: INDEX_NAME,
          id: id,
        });

        if (getResponse.body.found) {
          const todo: Todo = getResponse.body._source;

          return response.ok({
            body: {
              success: true,
              body: todo,
            },
          });
        } else {
          return response.notFound({
            body: {
              message: 'TO-DO not found',
            },
          });
        }
      } catch (error: any) {
        console.log(error);
        if (error.statusCode === 404) {
          return response.notFound({
            body: {
              message: 'TO-DO not found.',
            },
          });
        }

        return response.internalError({
          body: {
            message: 'Failed to get TO-DO',
          },
        });
      }
    }
  );

  // Update TODO status
  router.patch(
    {
      path: '/api/custom_plugin/todos/{id}/status',
      validate: {
        params: schema.object({
          id: schema.string(),
        }),
        body: schema.object({
          status: schema.oneOf([schema.literal('planned'), schema.literal('completed')]),
        }),
      },
    },
    async (context, request, response) => {
      try {
        const { id } = request.params;
        const { status } = request.body;

        const indexExists = await context.core.opensearch.client.asCurrentUser.indices.exists({
          index: INDEX_NAME,
        });

        if (!indexExists.body) {
          return response.notFound({
            body: {
              message: 'TO-DO not found',
            },
          });
        }

        const documentExists = await context.core.opensearch.client.asCurrentUser.exists({
          index: INDEX_NAME,
          id: id,
        });

        if (!documentExists.body) {
          return response.notFound({
            body: {
              message: 'TO-DO not found',
            },
          });
        }

        await context.core.opensearch.client.asCurrentUser.update({
          index: INDEX_NAME,
          id: id,
          body: {
            doc: {
              status: status,
            },
          },
          refresh: true,
        });

        const getResponse = await context.core.opensearch.client.asCurrentUser.get({
          index: INDEX_NAME,
          id: id,
        });

        const updatedTodo: Todo = getResponse.body._source;
        const stats = await calculateStats(context.core.opensearch.client.asCurrentUser);

        return response.ok({
          body: {
            success: true,
            data: updatedTodo,
            stats,
          },
        });
      } catch (error: any) {
        console.log(error);

        if (error.statusCode === 404) {
          return response.notFound({
            body: {
              message: 'TO-DO not found',
            },
          });
        }

        return response.internalError({
          body: {
            message: 'Failed to update todo status',
          },
        });
      }
    }
  );

  // Delete TODO
  router.delete(
    {
      path: '/api/custom_plugin/todos/{id}/delete',
      validate: {
        params: schema.object({
          id: schema.string(),
        }),
      },
    },
    async (context, request, response) => {
      try {
        const { id } = request.params;

        const indexExists = await context.core.opensearch.client.asCurrentUser.indices.exists({
          index: INDEX_NAME,
        });

        if (!indexExists.body) {
          return response.notFound({
            body: {
              message: 'TO-DO not found',
            },
          });
        }

        await context.core.opensearch.client.asCurrentUser.delete({
          index: INDEX_NAME,
          id: id,
          refresh: true,
        });

        const stats = await calculateStats(context.core.opensearch.client.asCurrentUser);

        return response.ok({
          body: {
            success: true,
            message: 'TO-DO deleted successfully',
            deletedId: id,
            stats,
          },
        });
      } catch (error: any) {
        console.log(error);
        if (error.statusCode === 404) {
          return response.notFound({
            body: {
              message: 'TO-DO not found',
            },
          });
        }

        return response.internalError({
          body: {
            message: 'Failed to delete todo',
          },
        });
      }
    }
  );
}
