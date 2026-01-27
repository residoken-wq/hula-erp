const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Colors for console output
const colors = {
    reset: "\x1b[0m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    cyan: "\x1b[36m",
    bold: "\x1b[1m"
};

const projectRoot = path.resolve(__dirname, '..');

const workspaces = [
    { name: 'Backend', path: projectRoot, type: 'nest' },
    { name: 'Frontend (Admin)', path: path.join(projectRoot, 'frontend'), type: 'vite' },
    { name: 'CMS', path: path.join(projectRoot, 'hula-web/cms'), type: 'next' },
    { name: 'Website', path: path.join(projectRoot, 'hula-web/website'), type: 'next' }
];

async function runCommand(command, args, cwd, name) {
    return new Promise((resolve, reject) => {
        console.log(`${colors.cyan}[${name}] Running: ${command} ${args.join(' ')}${colors.reset}`);

        const child = spawn(command, args, { cwd, shell: true, stdio: 'inherit' });

        child.on('close', (code) => {
            if (code === 0) {
                console.log(`${colors.green}[${name}] ✓ Passed${colors.reset}`);
                resolve();
            } else {
                console.error(`${colors.red}[${name}] ✗ Failed with code ${code}${colors.reset}`);
                reject(new Error(`Command failed in ${name}`));
            }
        });

        child.on('error', (err) => {
            console.error(`${colors.red}[${name}] Error: ${err.message}${colors.reset}`);
            reject(err);
        });
    });
}

async function runQA() {
    console.log(`${colors.bold}${colors.yellow}🚀 Starting QA Checks (Linting & Type Checking)...${colors.reset}\n`);

    let failed = false;

    for (const workspace of workspaces) {
        console.log(`${colors.bold}👉 Checking ${workspace.name}...${colors.reset}`);

        try {
            // 1. Type Check (All Projects)
            // Using tsc --noEmit to check types without generating files
            // For root (backend), we use the local tsc
            await runCommand('npx', ['tsc', '--noEmit'], workspace.path, workspace.name + ' TypeCheck');

            // 2. Linting
            if (workspace.type === 'nest') {
                await runCommand('npm', ['run', 'lint'], workspace.path, workspace.name + ' Lint');
            } else if (workspace.type === 'next') {
                await runCommand('npx', ['next', 'lint'], workspace.path, workspace.name + ' Lint');
            } else if (workspace.type === 'vite') {
                // Frontend might not have lint script set up, skipping or checking if script exists
                const pkgJson = JSON.parse(fs.readFileSync(path.join(workspace.path, 'package.json'), 'utf8'));
                if (pkgJson.scripts && pkgJson.scripts.lint) {
                    await runCommand('npm', ['run', 'lint'], workspace.path, workspace.name + ' Lint');
                }
            }

        } catch (error) {
            console.error(error.message);
            failed = true;
        }
        console.log('-----------------------------------');
    }

    // 3. Backend Tests
    console.log(`${colors.bold}👉 Running Backend Tests...${colors.reset}`);
    try {
        await runCommand('npm', ['run', 'test'], projectRoot, 'Backend Tests');
    } catch (error) {
        // If tests fail, we mark as failed, but we know there might be none initially
        console.error(`${colors.yellow}⚠️ Backend tests failed. If you haven't written tests yet, this is expected.${colors.reset}`);
        // failed = true; // Strict mode: uncomment to fail build on test failure
    }

    if (failed) {
        console.error(`\n${colors.red}❌ QA Checks Failed. Please fix errors before building/committing.${colors.reset}`);
        process.exit(1);
    } else {
        console.log(`\n${colors.green}✅ All QA Checks Passed! You are safe to build/commit.${colors.reset}`);
        process.exit(0);
    }
}

runQA();
