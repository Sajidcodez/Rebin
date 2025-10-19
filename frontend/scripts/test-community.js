#!/usr/bin/env node

/**
 * Community Features Test Runner
 *
 * This script runs comprehensive tests for all community features including:
 * - Challenge System
 * - Leaderboard System
 * - Achievement System
 * - Notification Center
 * - Advanced UI Components
 * - Mobile Navigation
 *
 * Usage:
 *   npm run test:community
 *   npm run test:community -- --watch
 *   npm run test:community -- --coverage
 */

import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test configuration
const testConfig = {
  // Test directories
  testDirs: [
    "src/test/components/community",
    "src/test/components/ui",
    "src/test/components/navigation",
    "src/test/lib/repositories",
    "src/test/lib/services",
  ],

  // Test patterns
  testPatterns: [
    "**/*.test.tsx",
    "**/*.test.ts",
    "**/*.spec.tsx",
    "**/*.spec.ts",
  ],

  // Coverage thresholds
  coverageThresholds: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    // Component-specific thresholds
    "src/components/community": {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
    "src/components/ui": {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
};

// Parse command line arguments
const args = process.argv.slice(2);
const isWatch = args.includes("--watch");
const isCoverage = args.includes("--coverage");
const isVerbose = args.includes("--verbose");
const isDebug = args.includes("--debug");

// Build test command
function buildTestCommand() {
  const baseCommand = "npx vitest";
  const options = [];

  // Add test patterns - use a single pattern that covers all test directories
  const testPattern = "src/test/**/*.{test,spec}.{ts,tsx}";
  options.push(testPattern);

  // Add watch mode
  if (isWatch) {
    options.push("--watch");
  }

  // Add coverage
  if (isCoverage) {
    options.push("--coverage");
    options.push("--coverage.thresholds.branches=80");
    options.push("--coverage.thresholds.functions=80");
    options.push("--coverage.thresholds.lines=80");
    options.push("--coverage.thresholds.statements=80");
  }

  // Add verbose output
  if (isVerbose) {
    options.push("--reporter=verbose");
  }

  // Add debug mode
  if (isDebug) {
    options.push("--reporter=verbose");
    options.push("--no-coverage");
  }

  return `${baseCommand} ${options.join(" ")}`;
}

// Run specific test suites
function runTestSuite(suite) {
  const suites = {
    challenges: "src/test/components/community/ChallengeSystem.test.tsx",
    leaderboard: "src/test/components/community/Leaderboard.test.tsx",
    achievements: "src/test/components/community/AchievementSystem.test.tsx",
    notifications: "src/test/components/community/NotificationCenter.test.tsx",
    ui: "src/test/components/ui",
    navigation: "src/test/components/navigation",
    repositories: "src/test/lib/repositories",
    services: "src/test/lib/services",
  };

  if (suites[suite]) {
    const command = `npx vitest ${suites[suite]} ${isWatch ? "--watch" : ""}`;
    console.log(`Running ${suite} tests...`);
    execSync(command, { stdio: "inherit" });
  } else {
    console.error(`Unknown test suite: ${suite}`);
    console.log("Available suites:", Object.keys(suites).join(", "));
    process.exit(1);
  }
}

// Main execution
function main() {
  console.log("🧪 Community Features Test Runner");
  console.log("=====================================\n");

  // Check if specific suite is requested
  const suiteArg = args.find((arg) => !arg.startsWith("--"));
  if (suiteArg) {
    runTestSuite(suiteArg);
    return;
  }

  // Run all tests
  const command = buildTestCommand();
  console.log("Running command:", command);
  console.log("");

  try {
    execSync(command, { stdio: "inherit" });
    console.log("\n✅ All tests completed successfully!");
  } catch (error) {
    console.error("\n❌ Tests failed!");
    process.exit(1);
  }
}

// Help text
if (args.includes("--help") || args.includes("-h")) {
  console.log(`
Community Features Test Runner

Usage:
  npm run test:community [options] [suite]

Options:
  --watch       Run tests in watch mode
  --coverage    Generate coverage report
  --verbose     Verbose output
  --debug       Debug mode (no coverage)
  --help        Show this help

Test Suites:
  challenges    Challenge System tests
  leaderboard   Leaderboard System tests
  achievements  Achievement System tests
  notifications Notification Center tests
  ui           UI Components tests
  navigation   Mobile Navigation tests
  repositories Repository layer tests
  services     Service layer tests

Examples:
  npm run test:community
  npm run test:community -- --watch
  npm run test:community -- --coverage
  npm run test:community challenges
  npm run test:community ui -- --watch
`);
  process.exit(0);
}

// Run main function
main();
