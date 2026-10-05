// ============================================================================
//  What to do when something goes wrong.
//
//  Every failure the app can produce gets a numbered checklist, in the order a
//  beginner should try things. Printed to the terminal AND written to the log,
//  so a student who pastes their log file has the advice attached to the error.
// ============================================================================
const LEVEL = 1;
const PORT = () => process.env.PORT || 4001;

// Documentation worth having at hand. Printed at startup and attached to the
// failures they explain, so a student never has to guess what to search for.
const DOCS = {
  swagger: () => `http://localhost:${PORT()}/api-docs   (this app's own API reference)`,
  express: 'Express routing      https://expressjs.com/en/guide/routing.html',
  expressMw: 'Express middleware   https://expressjs.com/en/guide/using-middleware.html',
  mongoose: 'Mongoose schemas     https://mongoosejs.com/docs/guide.html',
  mongooseValidation: 'Mongoose validation  https://mongoosejs.com/docs/validation.html',
  mongooseQueries: 'Mongoose queries     https://mongoosejs.com/docs/queries.html',
  objectId: 'MongoDB ObjectId     https://www.mongodb.com/docs/manual/reference/method/ObjectId/',
  connectionString: 'Connection strings   https://www.mongodb.com/docs/manual/reference/connection-string/',
  atlasAccessList: 'Atlas IP access list https://www.mongodb.com/docs/atlas/security/ip-access-list/',
  atlasUsers: 'Atlas database users https://www.mongodb.com/docs/atlas/security-add-mongodb-users/',
  bcrypt: 'bcrypt (password hashing) https://github.com/dcodeIO/bcrypt.js#readme',
  owasp: 'OWASP authentication cheat sheet https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html',
  httpStatus: 'HTTP status codes    https://developer.mozilla.org/en-US/docs/Web/HTTP/Status',
  json: 'JSON request bodies  https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Type',
  dotenv: 'dotenv / .env files  https://github.com/motdotla/dotenv#readme',
  nodeTest: 'Node test runner     https://nodejs.org/api/test.html'
};

// Ordered steps for running this app from nothing
const HOW_TO_RUN = [
  'cd into the extracted IFT_Level1 folder',
  'npm install                      - install dependencies (once)',
  'Copy config.env.example to .env using your editor or file manager',
  'edit .env                        - set DATABASE, STUDENT_NAME and STUDENT_ID',
  'npm run seed                     - load sample users and games',
  'npm start                        - start the server',
  `open http://localhost:${PORT()}/api-docs - try the API in Swagger UI`,
  'npm test                         - run the tests (temporary MongoDB; first run may download a binary)'
];

// Startup failures - the database is the usual suspect
const STARTUP_CHECKS = {
  missingConfig: [
    'This folder has no .env or config.env yet.',
    'Copy config.env.example to .env, then edit DATABASE.',
    'Follow Assignment instructions/ASSIGNMENT.md for the Atlas setup.',
    'Then start the app again with npm start.',
    `Docs: ${DOCS.dotenv}`,
    `Docs: ${DOCS.connectionString}`
  ],
  badAuth: [
    'MongoDB rejected the username or password in your connection string.',
    'Check DATABASE and DATABASE_PASSWORD in .env / config.env.',
    'In Atlas, check the database user credentials (not your Atlas account login).',
    '  If necessary, reset that database user password and update .env.',
    'Then retry npm start here.',
    `Docs: ${DOCS.atlasUsers}`,
    `Docs: ${DOCS.connectionString}`
  ],
  unreachable: [
    'The database could not be reached at all.',
    'Local MongoDB? Check it is running: docker ps, or brew services list.',
    '  Start one with: docker run -d -p 27017:27017 --name ift458-mongo mongo',
    'Atlas? Your IP may not be on the access list.',
    '  In Atlas Network Access, add your current IP address.',
    'Also check you are online and not behind a VPN that blocks port 27017.',
    `Docs: ${DOCS.atlasAccessList}`
  ],
  generic: [
    'Read the error message above - it is the database talking, not this app.',
    'Confirm DATABASE in .env / config.env is the string you expect.',
    'Review the connection steps in Assignment instructions/ASSIGNMENT.md',
    'Still stuck? Open the newest file in logs/ - the full detail is there.',
    `Docs: ${DOCS.connectionString}`
  ]
};

// Pick the right startup checklist from the driver's error
function diagnoseStartup(err) {
  const message = String(err?.message || '');
  if (/bad auth|Authentication failed/i.test(message)) return { kind: 'badAuth', steps: STARTUP_CHECKS.badAuth };
  if (/ENOTFOUND|ECONNREFUSED|timed out|ServerSelection/i.test(message)) {
    return { kind: 'unreachable', steps: STARTUP_CHECKS.unreachable };
  }
  return { kind: 'generic', steps: STARTUP_CHECKS.generic };
}

// Request failures - what a 4xx/5xx means HERE, at this level
const REQUEST_CHECKS = {
  400: [
    'The request body failed validation.',
    'Check the field names against /api-docs - they are case sensitive.',
    'Passwords must be at least 8 characters, and passwordConfirmation must match.',
    'Sending JSON? Set the Content-Type: application/json header.',
    `Docs: ${DOCS.mongooseValidation}`,
    `Docs: ${DOCS.json}`
  ],
  401: [
    'The email or password did not match.',
    'Level 1 gives the SAME message for an unknown email and a wrong password, on purpose.',
    'Seeded users log in with password12345 (run npm run seed first).',
    'Remember: Level 1 has no session, so there is no "logged in" state to lose.',
    `Docs: ${DOCS.bcrypt}`,
    `Docs: ${DOCS.owasp}`
  ],
  404: [
    'No route or document matched.',
    'Check the URL against /api-docs, including the /api/v1 prefix.',
    'For /games/:id, the id must be a 24-character MongoDB ObjectId from GET /games.',
    `Docs: ${DOCS.express}`,
    `Docs: ${DOCS.objectId}`
  ],
  409: ['That email is already registered. Use another, or re-run npm run seed to reset the data.'],
  413: ['The request body is too large. Send less data.'],
  500: [
    'The app itself failed - this is a bug, not your request.',
    'Read the stack trace in the newest logs/ file.',
    'Is MongoDB still reachable? Review the connection steps in Assignment instructions/ASSIGNMENT.md',
    'Restart with npm start and try the same request again.',
    `Docs: ${DOCS.expressMw}`,
    `Docs: ${DOCS.httpStatus}`
  ]
};

const diagnoseRequest = (statusCode) =>
  REQUEST_CHECKS[statusCode] || (statusCode >= 500 ? REQUEST_CHECKS[500] : REQUEST_CHECKS[400]);

module.exports = { HOW_TO_RUN, STARTUP_CHECKS, REQUEST_CHECKS, DOCS, diagnoseStartup, diagnoseRequest, LEVEL };
