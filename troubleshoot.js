#!/usr/bin/env node

/**
 * Care-Connect Troubleshooting Script
 *
 * This script helps diagnose common issues with the Care-Connect application,
 * especially database connectivity and user sync problems.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Care-Connect Troubleshooting Script\n');

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function logSuccess(message) {
  console.log(`${colors.green}✅ ${message}${colors.reset}`);
}

function logError(message) {
  console.log(`${colors.red}❌ ${message}${colors.reset}`);
}

function logWarning(message) {
  console.log(`${colors.yellow}⚠️  ${message}${colors.reset}`);
}

function logInfo(message) {
  console.log(`${colors.blue}ℹ️  ${message}${colors.reset}`);
}

function runCommand(command, description) {
  try {
    logInfo(`Running: ${description}`);
    const result = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    logSuccess(`${description} - OK`);
    return result;
  } catch (error) {
    logError(`${description} - FAILED`);
    logError(`Error: ${error.message}`);
    return null;
  }
}

// Check 1: Node.js version
function checkNodeVersion() {
  logInfo('Checking Node.js version...');
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

  if (majorVersion >= 18) {
    logSuccess(`Node.js version: ${nodeVersion}`);
  } else {
    logError(`Node.js version ${nodeVersion} is too old. Please upgrade to Node.js 18+`);
  }
}

// Check 2: Environment file
function checkEnvironmentFile() {
  logInfo('Checking environment configuration...');

  const envPath = path.join(__dirname, '.env.local');
  const envExamplePath = path.join(__dirname, '_env');

  if (!fs.existsSync(envPath)) {
    logError('.env.local file not found');
    if (fs.existsSync(envExamplePath)) {
      logInfo('Copy _env to .env.local and configure your credentials');
    }
    return false;
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const requiredVars = [
    'DATABASE_URL',
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    'CLERK_SECRET_KEY',
    'NEXT_PUBLIC_VONAGE_APPLICATION_ID'
  ];

  let missingVars = [];
  requiredVars.forEach(varName => {
    if (!envContent.includes(`${varName}=`)) {
      missingVars.push(varName);
    }
  });

  if (missingVars.length > 0) {
    logError(`Missing environment variables: ${missingVars.join(', ')}`);
    return false;
  }

  logSuccess('Environment file exists and has required variables');
  return true;
}

// Check 3: Dependencies
function checkDependencies() {
  logInfo('Checking dependencies...');

  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

    const criticalDeps = ['@prisma/client', 'next', 'react', '@clerk/nextjs'];
    let missingDeps = [];

    criticalDeps.forEach(dep => {
      if (!dependencies[dep]) {
        missingDeps.push(dep);
      }
    });

    if (missingDeps.length > 0) {
      logError(`Missing critical dependencies: ${missingDeps.join(', ')}`);
      logInfo('Run: npm install');
      return false;
    }

    logSuccess('All critical dependencies found');
    return true;
  } catch (error) {
    logError('Could not read package.json');
    return false;
  }
}

// Check 4: Database connection
function checkDatabaseConnection() {
  logInfo('Checking database connection...');

  const result = runCommand('npx prisma db ping', 'Database connection test');
  if (result) {
    return true;
  }
  return false;
}

// Check 5: Prisma client
function checkPrismaClient() {
  logInfo('Checking Prisma client...');

  const result = runCommand('npx prisma generate', 'Prisma client generation');
  if (result) {
    logSuccess('Prisma client generated successfully');
    return true;
  }
  return false;
}

// Check 6: Database migrations
function checkMigrations() {
  logInfo('Checking database migrations...');

  const result = runCommand('npx prisma migrate status', 'Migration status check');
  if (result && result.includes('up to date')) {
    logSuccess('Database migrations are up to date');
    return true;
  } else {
    logWarning('Database migrations may need to be run');
    logInfo('Run: npx prisma migrate dev');
    return false;
  }
}

// Check 7: Build test
function checkBuild() {
  logInfo('Testing build process...');

  const result = runCommand('npm run build', 'Build test');
  if (result) {
    logSuccess('Build completed successfully');
    return true;
  }
  return false;
}

// Main troubleshooting function
async function troubleshoot() {
  console.log(`${colors.bold}🚀 Starting Care-Connect Troubleshooting...\n${colors.reset}`);

  const checks = [
    { name: 'Node.js Version', fn: checkNodeVersion },
    { name: 'Environment Configuration', fn: checkEnvironmentFile },
    { name: 'Dependencies', fn: checkDependencies },
    { name: 'Database Connection', fn: checkDatabaseConnection },
    { name: 'Prisma Client', fn: checkPrismaClient },
    { name: 'Database Migrations', fn: checkMigrations },
    { name: 'Build Process', fn: checkBuild }
  ];

  let allPassed = true;

  for (const check of checks) {
    console.log(`\n${colors.bold}--- ${check.name} ---${colors.reset}`);
    try {
      const passed = await check.fn();
      if (!passed) allPassed = false;
    } catch (error) {
      logError(`Check failed with error: ${error.message}`);
      allPassed = false;
    }
  }

  console.log(`\n${colors.bold}=== TROUBLESHOOTING COMPLETE ===${colors.reset}`);

  if (allPassed) {
    logSuccess('All checks passed! Your application should be ready to run.');
    logInfo('Start the development server with: npm run dev');
  } else {
    logError('Some checks failed. Please address the issues above before running the application.');
  }

  // Specific advice for "User not found in database" error
  console.log(`\n${colors.bold}💡 Specific Fix for "User not found in database" Error:${colors.reset}`);
  logInfo('1. Ensure your .env.local has correct DATABASE_URL');
  logInfo('2. Run: npx prisma migrate dev');
  logInfo('3. Run: npx prisma generate');
  logInfo('4. Check Clerk webhook configuration');
  logInfo('5. Try signing up again with a fresh user account');

  console.log(`\n${colors.bold}📚 For more help, see:${colors.reset}`);
  logInfo('- SETUP.md for detailed setup instructions');
  logInfo('- README.md for project overview');
  logInfo('- Check the troubleshooting section in SETUP.md');
}

// Run troubleshooting if this script is executed directly
if (require.main === module) {
  troubleshoot().catch(console.error);
}

module.exports = { troubleshoot };
