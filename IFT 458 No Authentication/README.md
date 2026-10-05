# IFT 458 Level 1 student project

Start with **[START-HERE.html](START-HERE.html)**: double-click it to read the instructions in your browser. It works before the application is running. The complete assignment is also available as [Markdown](Assignment%20instructions/ASSIGNMENT.md).

This Game Score Tracker API checks passwords against MongoDB but issues no session cookie or token. Games and scores have no authorization checks. You will configure your own database, exercise the API, inspect its logs, and explain this weakness.

## Before you start

Use Node.js **22.19.0 or later in the 22.x line** (the version used to check this package), npm, an editor, a browser, a MongoDB Atlas account, and Word for your submission. The installed database libraries require at least Node 20.19.0. Internet access is needed to install dependencies, connect to Atlas, and download the temporary MongoDB binary on the first test run.

## Quick setup

1. Extract the download and open the inner `IFT_Level1` folder containing `package.json`.
2. In its terminal run `npm ci` (or `npm install`).
3. Copy `config.env.example` to `.env`. Add your own Atlas configuration, name, and student ID as explained in the assignment. A second `config.env` file is unnecessary.
4. Run `npm run seed` once against your own assignment database. It **deletes existing users and games** in that database before importing samples; scores are not cleared.
5. Run `npm start` and open <http://localhost:4001/api-docs>.
6. Complete the assignment in one server run. Press **Ctrl+C** to finalize its log.

On Windows PowerShell, copy the configuration with `Copy-Item config.env.example .env`. On macOS/Linux, use `cp config.env.example .env`.

## Included instructions

- [Complete assignment](Assignment%20instructions/ASSIGNMENT.md): setup, tasks, screenshots, rubric, troubleshooting, and submission.
- [Swagger guide](Assignment%20instructions/SWAGGER-GUIDE.md): how to send requests and read responses at Level 1.
- [Submission checklist](Assignment%20instructions/SUBMISSION-CHECKLIST.md): check your evidence before uploading.

The HTML and Markdown instructions replace the earlier Word handouts. Older Word files retained in the instructor's working folder are not part of this student release.

## Project map

| File or folder | Purpose |
|---|---|
| `server.js` | Reads configuration, connects MongoDB, starts and stops the server |
| `app.js` | Connects middleware, routes, and Swagger UI |
| `SwaggerTFT458.js` | OpenAPI description displayed at `/api-docs` |
| `controllers/` | User, game, and score request handlers |
| `models/` | Data schemas, validation, and password hashing |
| `routes/` | Routes; game and score operations have no access guards |
| `utils/`, `middleware/` | Request logs, troubleshooting, and learning outcome tracking |
| `dev-data/` | Seed script and sample users and games |
| `tests/` | Automated checks using temporary databases |
| `logs/` | Created when running the app; contains your submission log |

`npm test` checks application behavior, including the intentional absence of authorization. It does not replace your screenshots or your local server log. The package contains no credentials, installed `node_modules`, or another student's evidence.
