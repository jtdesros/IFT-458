// LEVEL 1 - Simple DB Authentication, ZERO Authorization
// The server can check "is this email + password correct?" but it never
// REMEMBERS the answer. Every request after login is anonymous again.
const express = require('express');
const swaggerUi = require('swagger-ui-express');

const swaggerDocument = require('./SwaggerTFT458');
const authController = require('./controllers/authController');
const gameController = require('./controllers/gameController');
const scoreController = require('./controllers/scoreController');

const userRoutes = require('./routes/userRoutes');
const gameRoutes = require('./routes/gameRoutes');
const scoreRoutes = require('./routes/scoreRoutes');
const requestLogger = require('./middleware/requestLogger');
const errorHandler = require('./middleware/errorHandler');
const { createLogger } = require('./utils/logger');

const API = process.env.API_VERSION || '/api/v1';

// Give every exported handler a name, so the request log can say which
// controller ran: [authController.login] instead of [(no controller)].
function tagControllers(modules) {
  for (const [moduleName, controllerModule] of Object.entries(modules)) {
    for (const [exportName, handler] of Object.entries(controllerModule)) {
      if (typeof handler === 'function') handler.controllerName = `${moduleName}.${exportName}`;
    }
  }
}

// server.js passes its logger in; tests can call createApp() with no argument
module.exports = function createApp(log = createLogger({ name: 'app-test', toConsole: false }), tracker = null) {
  tagControllers({ authController, gameController, scoreController });

  const app = express();

  // 1) Body parser: read JSON request bodies into req.body
  app.use(express.json());

  // 2) Log every request: route, controller, payload, outcome (and on failure,
  //    an ordered checklist of what to check)
  app.use(requestLogger(log, tracker));

  // 3) API documentation - open http://localhost:4001/api-docs
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  app.get('/', (req, res) => res.redirect('/api-docs'));

  // 4) Routes
  app.use(`${API}/users`, userRoutes); // signup + login
  app.use(`${API}/games`, gameRoutes); // notice: NO middleware guards these routes
  app.use(`${API}/scores`, scoreRoutes); // same story: wide open

  // 5) 404 + central error handler (Express 5 forwards async errors here automatically)
  app.use((req, res, next) => {
    const err = new Error(`Cannot find ${req.method} ${req.originalUrl}`);
    err.statusCode = 404;
    next(err);
  });
  app.use(errorHandler(log));

  return app;
};
