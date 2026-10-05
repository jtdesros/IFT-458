// ============================================================================
//  IFT 458 - Level 1 API documentation (OpenAPI 3.0)
//  ALL Swagger docs for this project live in this one file.
//  app.js serves it at  http://localhost:<PORT>/api-docs
//
//  To document a new route: add an entry under `paths`, and if it sends or
//  returns a new shape of data, add that shape under `components.schemas`.
// ============================================================================
const API = process.env.API_VERSION || '/api/v1';
const PORT = process.env.PORT || 4001;

const gameFields = {
  title: { type: 'string', maxLength: 200, example: 'Hollow Knight' },
  developer: { type: 'string', maxLength: 200, example: 'Team Cherry' },
  genre: { type: 'string', maxLength: 60, example: 'Metroidvania' },
  description: { type: 'string', maxLength: 2000, example: 'A hand-drawn adventure beneath a ruined kingdom.' },
  platform: { type: 'string', enum: ['pc', 'console', 'mobile', 'handheld', 'arcade'], example: 'pc' },
  status: { type: 'string', enum: ['active', 'retired'], example: 'active' },
  submittedBy: {
    type: 'string',
    example: 'Alice',
    description: 'Free text typed by the client. The server cannot verify it - that is the Level 1 weakness.'
  }
};

const idParam = {
  name: 'id',
  in: 'path',
  required: true,
  description: 'MongoDB ObjectId of the game',
  schema: { type: 'string', example: '66f0c2a4e1b2c3d4e5f60718' }
};

const errorResponse = (description) => ({
  description,
  content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } }
});

module.exports = {
  openapi: '3.0.3',
  info: {
    title: 'IFT 458 Game Score Tracker - Level 1: Simple DB Authentication',
    version: '1.0.0',
    description: [
      'Level 1 of 3. The server checks an email + password against MongoDB (bcrypt hash),',
      'but issues **no session, cookie or token**. Every request is anonymous, so there is',
      '**zero authorization**: anyone can create, edit and delete any game.',
      '',
      '**Try it:** sign up, log in, then delete a game *without* logging in. Nothing stops you.'
    ].join('\n')
  },
  servers: [{ url: `http://localhost:${PORT}${API}`, description: 'Local development' }],
  tags: [
    {
      name: 'Authentication',
      description: 'Start with POST /users/signup to create an application user, then POST /users/login ' +
        'to check that user’s email and password. Expand an endpoint and choose Try it out, edit the ' +
        'JSON body, then Execute. Use application credentials, not your MongoDB Atlas database user. ' +
        'Level 1 returns no token, cookie, or session; games and scores remain accessible without login.'
    },
    { name: 'Scores', description: 'Scores - completely unprotected, like the catalogue' },
    { name: 'Games', description: 'Game catalogue CRUD - completely unprotected' }
  ],

  paths: {

    '/scores': {
      get: {
        tags: ['Scores'],
        summary: 'List scores (anyone)',
        responses: {
          200: { description: 'Scores', content: { 'application/json': { schema: { $ref: '#/components/schemas/ScoreListResponse' } } } },
          401: errorResponse('Not authenticated')
        }
      },
      post: {
        tags: ['Scores'],
        summary: 'Submit a score (anyone)',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ScoreInput' } } } },
        responses: {
          201: { description: 'Score created', content: { 'application/json': { schema: { $ref: '#/components/schemas/ScoreResponse' } } } },
          400: errorResponse('Validation failed'),
          401: errorResponse('Not authenticated')
        }
      }
    },

    '/scores/{id}': {
      parameters: [{ name: 'id', in: 'path', required: true, description: 'MongoDB ObjectId of the score', schema: { type: 'string' } }],
      get: {
        tags: ['Scores'],
        summary: 'Get one score (anyone)',
        responses: {
          200: { description: 'The score', content: { 'application/json': { schema: { $ref: '#/components/schemas/ScoreResponse' } } } },
          401: errorResponse('Not authenticated'),
          403: errorResponse('Not your score'),
          404: errorResponse('Score not found')
        }
      },
      patch: {
        tags: ['Scores'],
        summary: 'Update a score, e.g. mark it verified (anyone)',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ScoreInput' } } } },
        responses: {
          200: { description: 'Updated score', content: { 'application/json': { schema: { $ref: '#/components/schemas/ScoreResponse' } } } },
          401: errorResponse('Not authenticated'),
          403: errorResponse('Not your score'),
          404: errorResponse('Score not found')
        }
      },
      delete: {
        tags: ['Scores'],
        summary: 'Delete a score (anyone)',
        responses: {
          204: { description: 'Deleted' },
          401: errorResponse('Not authenticated'),
          403: errorResponse('Not allowed'),
          404: errorResponse('Score not found')
        }
      }
    },
    '/users/signup': {
      post: {
        tags: ['Authentication'],
        summary: 'Register a new user',
        description: 'The password is hashed with bcrypt before it is stored. No token is returned.',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/SignupRequest' } } }
        },
        responses: {
          201: {
            description: 'User created',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/UserResponse' } } }
          },
          400: errorResponse('Validation failed (missing field, short password, passwords do not match)'),
          409: errorResponse('Email already registered')
        }
      }
    },

    '/users/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Check email + password',
        description:
          'Returns 200 if the credentials are correct - and nothing else. There is no token to send ' +
          'with the next request, so the server forgets you immediately.',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } }
        },
        responses: {
          200: {
            description: 'Credentials are valid',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginResponse' } } }
          },
          400: errorResponse('Email or password missing'),
          401: errorResponse('Incorrect email or password (same message for both, on purpose)')
        }
      }
    },

    '/games': {
      get: {
        tags: ['Games'],
        summary: 'List all games',
        responses: {
          200: {
            description: 'All games, newest first',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/GameListResponse' } } }
          }
        }
      },
      post: {
        tags: ['Games'],
        summary: 'Add a game (no login required!)',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/GameInput' } } }
        },
        responses: {
          201: {
            description: 'Game created',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/GameResponse' } } }
          },
          400: errorResponse('Validation failed')
        }
      }
    },

    '/games/{id}': {
      parameters: [idParam],
      get: {
        tags: ['Games'],
        summary: 'Get one game',
        responses: {
          200: {
            description: 'The game',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/GameResponse' } } }
          },
          400: errorResponse('Invalid id'),
          404: errorResponse('Game not found')
        }
      },
      patch: {
        tags: ['Games'],
        summary: 'Edit ANY game (no login required!)',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/GameUpdate' } } }
        },
        responses: {
          200: {
            description: 'Updated game',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/GameResponse' } } }
          },
          400: errorResponse('Invalid id or validation failed'),
          404: errorResponse('Game not found')
        }
      },
      delete: {
        tags: ['Games'],
        summary: 'Delete ANY game (no login required!)',
        responses: {
          204: { description: 'Deleted' },
          400: errorResponse('Invalid id'),
          404: errorResponse('Game not found')
        }
      }
    }
  },

  components: {
    schemas: {
      ScoreInput: {
        type: 'object',
        required: ['gameTitle', 'points', 'playerEmail'],
        properties: {
          gameTitle: { type: 'string', example: 'Hollow Knight' },
          platform: { type: 'string', enum: ['pc', 'console', 'mobile', 'handheld', 'arcade'], example: 'pc' },
          points: { type: 'integer', minimum: 0, maximum: 100000000, example: 128400 },
          levelReached: { type: 'integer', minimum: 1, maximum: 999, example: 12 },
          playerEmail: { type: 'string', format: 'email', example: 'player1@ift458.test', description: 'Typed by the client - Level 1 cannot verify it' },
          status: { type: 'string', enum: ['submitted', 'verified', 'rejected', 'disputed'], example: 'submitted' },
          playedAt: { type: 'string', format: 'date-time' }
        }
      },
      Score: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '66f0c2a4e1b2c3d4e5f60718' },
          gameTitle: { type: 'string', example: 'Hollow Knight' },
          platform: { type: 'string', enum: ['pc', 'console', 'mobile', 'handheld', 'arcade'] },
          points: { type: 'integer', example: 128400 },
          levelReached: { type: 'integer', nullable: true, example: 12 },
          userId: { type: 'string', nullable: true, description: 'The player' },
          playerEmail: { type: 'string', example: 'player1@ift458.test' },
          status: { type: 'string', enum: ['submitted', 'verified', 'rejected', 'disputed'] },
          playedAt: { type: 'string', format: 'date-time' },
          verifiedAt: { type: 'string', format: 'date-time', nullable: true }
        }
      },
      ScoreResponse: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'success' },
          data: { type: 'object', properties: { score: { $ref: '#/components/schemas/Score' } } }
        }
      },
      ScoreListResponse: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'success' },
          results: { type: 'integer', example: 3 },
          data: { type: 'object', properties: { scores: { type: 'array', items: { $ref: '#/components/schemas/Score' } } } }
        }
      },
      SignupRequest: {
        type: 'object',
        required: ['name', 'email', 'password', 'passwordConfirmation'],
        properties: {
          name: { type: 'string', example: 'Alice Johnson' },
          email: { type: 'string', format: 'email', example: 'alice@ift458.test' },
          password: { type: 'string', format: 'password', minLength: 8, example: 'password12345' },
          passwordConfirmation: { type: 'string', format: 'password', example: 'password12345' }
        }
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'alice@ift458.test' },
          password: { type: 'string', format: 'password', example: 'password12345' }
        }
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '66f0c2a4e1b2c3d4e5f60718' },
          name: { type: 'string', example: 'Alice Johnson' },
          email: { type: 'string', example: 'alice@ift458.test' }
        }
      },
      UserResponse: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'success' },
          data: { type: 'object', properties: { user: { $ref: '#/components/schemas/User' } } }
        }
      },
      LoginResponse: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'success' },
          message: { type: 'string', example: 'Credentials are valid. (The server will not remember this.)' },
          data: { type: 'object', properties: { user: { $ref: '#/components/schemas/User' } } }
        }
      },
      GameInput: {
        type: 'object',
        required: ['title', 'developer', 'description'],
        properties: gameFields
      },
      GameUpdate: {
        type: 'object',
        description: 'Send only the fields you want to change',
        properties: gameFields
      },
      Game: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '66f0c2a4e1b2c3d4e5f60718' },
          ...gameFields,
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      GameResponse: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'success' },
          data: { type: 'object', properties: { game: { $ref: '#/components/schemas/Game' } } }
        }
      },
      GameListResponse: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'success' },
          results: { type: 'integer', example: 3 },
          data: {
            type: 'object',
            properties: { games: { type: 'array', items: { $ref: '#/components/schemas/Game' } } }
          }
        }
      },
      Error: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'fail' },
          message: { type: 'string', example: 'Incorrect email or password.' }
        }
      }
    }
  }
};
