# Pre-Deployment Quality Check System

This document describes the comprehensive pre-deployment check system implemented to prevent errors like the Supabase vendor-chunks module resolution issue and ensure deployment readiness.

## Overview

The pre-deployment check system performs automated quality assurance checks before code deployment to catch issues early and prevent production failures.

## Features

### ✅ Comprehensive Checks

1. **Critical Files Verification**
   - Ensures essential configuration files exist (next.config.js, tsconfig.json, etc.)

2. **TypeScript Compilation**
   - Validates all TypeScript code compiles without errors
   - Catches type mismatches and syntax errors

3. **ESLint Code Quality**
   - Enforces coding standards and best practices
   - Automatically configured with Next.js recommendations

4. **Security Vulnerability Scanning**
   - Scans dependencies for known security issues
   - Configurable severity levels (high/critical in production, moderate+ in development)

5. **Environment Variable Validation**
   - Ensures required environment variables are set
   - Differentiates between critical and optional variables

6. **Package Consistency**
   - Verifies package.json and package-lock.json are in sync
   - Prevents dependency resolution issues

7. **Supabase Configuration**
   - Validates Supabase environment variables
   - Tests basic connectivity (in production mode)

8. **Build Verification**
   - Ensures the application builds successfully
   - Catches build-time errors before deployment

9. **Unit Test Execution**
   - Runs the complete test suite
   - Ensures all tests pass before deployment

## Usage

### Quick Commands

```bash
# Full pre-deployment checks (recommended before production deployment)
npm run pre-deploy

# Fast checks (skips tests and build - good for development)
npm run pre-deploy:fast

# Manual execution with options
npx tsx scripts/pre-deployment-check.ts --skip-tests
```

### Environment Modes

The system automatically adapts its strictness based on the environment:

#### Development Mode (`NODE_ENV=development`)
- Allows missing optional environment variables
- Only fails on high/critical security vulnerabilities
- Skips Supabase connectivity tests
- More lenient with missing configuration

#### Production Mode (default)
- Requires all environment variables
- Fails on moderate+ security vulnerabilities
- Performs full connectivity tests
- Strict validation of all components

#### CI Mode (`CI=true`)
- Similar to development but optimized for CI/CD pipelines
- Skips interactive checks
- Provides detailed logging for debugging

### Example Output

```
🚀 Starting pre-deployment checks...

🔍 Running Critical Files...
✅ Critical Files (1ms)
🔍 Running TypeScript Compilation...
✅ TypeScript Compilation (1270ms)
🔍 Running ESLint...
✅ ESLint (1421ms)
🔍 Running Dependency Security...
✅ Dependency Security (539ms)
🔍 Running Environment Variables...
✅ Environment Variables (0ms)
🔍 Running Package Consistency...
✅ Package Consistency (2ms)
🔍 Running Supabase Configuration...
✅ Supabase Configuration (58ms)
🔍 Running Unit Tests...
✅ Unit Tests (2100ms)
🔍 Running Build Verification...
✅ Build Verification (8500ms)

============================================================
📊 PRE-DEPLOYMENT CHECK SUMMARY
============================================================
✅ Passed: 9
❌ Failed: 0
⏱️  Total time: 13,892ms

🎉 ALL CHECKS PASSED - Ready for deployment!
```

## CI/CD Integration

### GitHub Actions

The system is integrated with GitHub Actions via `.github/workflows/pre-deployment.yml`:

- Runs on all pushes and pull requests to main branches
- Tests multiple Node.js versions (18.x, 20.x)
- Uploads test results and build artifacts
- Blocks deployment if checks fail

### Vercel Integration

The `vercel.json` configuration automatically runs pre-deployment checks:

```json
{
  "buildCommand": "npm run pre-deploy:fast && npm run build"
}
```

This ensures Vercel deployments are validated before build.

## Configuration

### Environment Variables

Create a `.env.local` file with required variables:

```bash
# Required for production
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Optional
ADMIN_EMAILS=admin@example.com
STRIPE_SECRET_KEY=sk_test_your-stripe-key-here
```

Use `.env.local.example` as a template.

### ESLint Configuration

The system automatically creates `.eslintrc.json` with Next.js best practices:

```json
{
  "extends": ["next/core-web-vitals", "next/typescript"],
  "rules": {
    "@typescript-eslint/no-unused-vars": "warn",
    "@typescript-eslint/no-explicit-any": "warn",
    "react-hooks/exhaustive-deps": "warn",
    "prefer-const": "warn"
  }
}
```

## Troubleshooting

### Common Issues

1. **TypeScript Errors**
   ```bash
   # Check specific errors
   npx tsc --noEmit
   ```

2. **ESLint Issues**
   ```bash
   # Auto-fix many issues
   npm run lint -- --fix
   ```

3. **Security Vulnerabilities**
   ```bash
   # Attempt automatic fixes
   npm audit fix
   
   # Force fixes (may introduce breaking changes)
   npm audit fix --force
   ```

4. **Missing Environment Variables**
   - Copy `.env.local.example` to `.env.local`
   - Fill in actual values for your environment
   - For development, only `NEXT_PUBLIC_SUPABASE_*` vars are critical

### Manual Override

In emergency situations, you can skip specific checks by modifying the script or using environment variables:

```bash
# Skip all checks (NOT RECOMMENDED)
SKIP_PRE_DEPLOY_CHECKS=true npm run build

# Skip only tests
npm run pre-deploy:fast
```

## Benefits

### Error Prevention
- **Module Resolution Errors**: TypeScript compilation catches import/export issues
- **Runtime Errors**: Environment validation prevents missing configuration
- **Security Issues**: Dependency scanning prevents vulnerable packages
- **Build Failures**: Build verification catches deployment issues early

### Quality Assurance
- **Code Standards**: ESLint ensures consistent code quality
- **Type Safety**: TypeScript compilation prevents type-related bugs
- **Test Coverage**: Unit tests verify functionality before deployment
- **Performance**: Build optimization validation

### Developer Experience
- **Fast Feedback**: Quick identification of issues
- **Automated Fixes**: Many issues can be auto-resolved
- **Clear Reporting**: Detailed output with actionable error messages
- **Integration**: Seamless CI/CD pipeline integration

## Next Steps

1. **Custom Checks**: Add project-specific validation rules
2. **Performance Testing**: Integrate Lighthouse CI for performance checks
3. **Database Migration**: Add database schema validation
4. **API Testing**: Include API endpoint health checks
5. **Security Scanning**: Add SAST/DAST security tools

## Support

For issues with the pre-deployment check system:

1. Check the console output for specific error details
2. Verify environment configuration
3. Run individual checks to isolate problems
4. Review the [troubleshooting section](#troubleshooting)

The system is designed to fail fast and provide clear error messages to guide resolution.