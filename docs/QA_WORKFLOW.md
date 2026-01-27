# Hula ERP - QA & Testing Workflow

This document outlines the automated Quality Assurance (QA) workflow to ensure code quality and prevent common errors before building the project.

## 🚀 Quick Start

Run the following command in the root directory to check the entire project:

```bash
npm run qa
```

## 🔍 What does it check?

The `qa` script runs the following checks across all workspaces (Backend, Frontend, CMS, Website):

1.  **Type Checking (`tsc --noEmit`)**:
    -   Ensures there are no TypeScript errors.
    -   Catches "silly errors" like syntax errors, invalid imports, and type mismatches that often break the build.
    -   Runs on: `Backend`, `Frontend (Admin)`, `CMS`, `Website`.

2.  **Linting (`eslint`)**:
    -   Enforces coding standards and best practices.
    -   catches potential bugs (unused variables, hooks dependencies, etc.).
    -   Runs on: `Backend`, `CMS`, `Website`.

3.  **Unit Tests (`jest`)**:
    -   Runs backend unit tests to ensure business logic is correct.
    -   Current scope: Verification of App Controller.

## 🛠 Workflow Integration

### Before manual build/deploy
Always run `npm run qa` before pushing code or triggering a deployment. If this script fails, **do not proceed**.

### Pre-commit Hook (Recommended)
You can automate this by using `husky`.

1.  Install husky:
    ```bash
    npm install husky --save-dev
    npx husky install
    ```

2.  Add a pre-commit hook:
    ```bash
    npx husky add .husky/pre-commit "npm run qa"
    ```

Now, every time you try to commit, the QA checks will run automatically. If they fail, the commit will be blocked.

## 📂 Project Structure

-   **`scripts/qa.js`**: The Node.js script that orchestrates the checks.
-   **`src/app.controller.spec.ts`**: Sample unit test for the backend.
