import { schema } from '@osd/config-schema';
import { IRouter } from '../../../../src/core/server';
import { Todo } from '../../common/types';
import { request } from 'http';

const INDEX_NAME = 'todos';

export function defineRoutes(router: IRouter) {
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

  // crear una tarea
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

        // verificar existencia del índice y si no existe, crearlo
        const indexExists = await context.core.opensearch.client.asCurrentUser.indices.exists({
          index: INDEX_NAME,
        });

        if (!indexExists.body) {
          await context.core.opensearch.client.asCurrentUser.indices.create({
            index: INDEX_NAME,
          });
        }

        // guardar el registro en OpenSearch
        await context.core.opensearch.client.asCurrentUser.create({
          index: INDEX_NAME,
          id: id,
          body: todo,
        });

        // devolver una respuesta en caso de ser satisfactoria
        return response.ok({
          body: {
            success: true,
            data: todo,
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

  // obtener todas las tareas
  router.get(
    {
      path: '/api/custom_plugin/todos',
      validate: {
        query: schema.object({
          page: schema.maybe(schema.number({ min: 1 })),
          limit: schema.maybe(schema.number({ min: 1, max: 100 })),
          status: schema.maybe(schema.oneOf([schema.literal('planned'), schema.literal('completed')])),
        }),
      },
    },
    async (context, request, response) => {
      try {
        const page = request.query.page || 1;
        const limit = request.query.limit || 10;
        const status = request.query.status;

        // calcular el offset para la paginación
        const from = (page - 1) * limit;

        // verificar si el índice existe
        const indexExists = await context.core.opensearch.client.asCurrentUser.indices.exists({
          index: INDEX_NAME,
        });

        // Si el índice no existe, retornar array vacío
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
            },
          });
        }

        // Construir la consulta de búsqueda
        let searchBody: any = {
          query: {},
          sort: [{ createdAt: { order: 'desc' } }],
          from,
          size: limit,
        };

        // Agregar filtro por status si se proporciona
        if (status) {
          searchBody.query = {
            term: {
              status: status,
            },
          };
        } else {
          // Si no hay filtro, traer todos los documentos
          searchBody.query = {
            match_all: {},
          };
        }

        // Ejecutar la búsqueda
        const searchResponse = await context.core.opensearch.client.asCurrentUser.search({
          index: INDEX_NAME,
          body: searchBody,
        });

        // Obtener el total de documentos para la paginación
        const totalHits = searchResponse.body.hits.total.value;
        const totalPages = Math.ceil(totalHits / limit);

        // Extraer los TO-DOs de la respuesta
        const todos: Todo[] = searchResponse.body.hits.hits.map((hit: any) => hit._source);

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
          },
        });
      } catch (error: any) {
        console.log(error);
        return response.internalError({
          body: {
            message: 'Failed to get todos',
          },
        });
      }
    }
  ); // end get

  // obtener una sola tarea
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

        if(!indexExists.body) {
          return response.notFound({
            body: {
              message: 'TO-DO not found'
            }
          })
        }

        // buscar el documento por ID
        const getResponse = await context.core.opensearch.client.asCurrentUser.get({
          index: INDEX_NAME,
          id: id,
        });

        // si el documento existe, retornarlo
        if(getResponse.body.found) {
          const todo: Todo = getResponse.body._source;

          return response.ok({
            body: {
              success: true,
              body: todo
            }
          })
        } else {
          return response.notFound({
            body: {
              message: 'TO-DO not found'
            }
          });
        }

      } catch (error: any) {
        console.log(error);
        if(error.statusCode === 404) {
          return response.notFound({
            body: {
              message: 'TO-DO not found.'
            }
          });
        }

        return response.internalError({
          body: {
            message: 'Failed to get TO-DO'
          }
        })
      }
    }
  ); // end get

  // ruta para actualizar de estado una tarea
  router.patch(
    {
      path: '/api/custom_plugin/todos/{id}/status',
      validate: {
        params: schema.object({
          id: schema.string()
        }),
        body: schema.object({
          status: schema.oneOf([schema.literal('planned'), schema.literal('completed')])
        })
      }
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
              status: status
            }
          }
        });

        // obtener el doc actualizado para retornarlo
        const getResponse = await context.core.opensearch.client.asCurrentUser.get({
          index: INDEX_NAME,
          id: id,
        });

        const updatedTodo: Todo = getResponse.body._source;

        return response.ok({
          body: {
            success: true,
            data: updatedTodo,
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
  ); // end patch

  router.delete(
    {
      path: '/api/custom_plugin/todos/{id}/delete',
      validate: {
        params: schema.object({
          id: schema.string(),
        })
      }
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
        });

        return response.ok({
          body: {
            success: true,
            message: 'TO-DO deleted successfully',
            deletedId: id,
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
  )

}
