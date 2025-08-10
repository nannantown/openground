# 🧪 Requirements-Driven Testing Framework

This project implements a comprehensive, requirements-driven testing framework that automatically generates test suites from structured requirements specifications.

## 📋 Overview

The testing framework consists of:

- **Requirements Specification** (`requirements/spec.yaml`) - Machine-readable requirements
- **Test Generation** - Automatic test suite generation from requirements  
- **Multi-layer Testing** - Unit, Integration, E2E, Performance, and Security tests
- **Traceability** - Full requirement-to-test mapping
- **CI/CD Integration** - Automated testing pipeline

## 🏗️ Architecture

```
requirements/
├── spec.yaml              # Requirements specification
└── custom-requirements/   # Additional requirement files

scripts/
└── generate-tests.ts      # Test generator script

tests/
├── e2e/                   # Generated E2E tests
├── unit/                  # Generated unit tests
├── test-utils.ts          # Test utilities
└── requirements-report.html # Traceability report

.github/workflows/
└── test.yml              # CI/CD pipeline
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
npm run playwright:install
```

### 2. Generate Tests from Requirements

```bash
npm run generate:tests
```

This will:
- Parse `requirements/spec.yaml`
- Generate E2E and unit tests
- Create test utilities and helpers
- Generate requirements traceability report

### 3. Run All Tests

```bash
npm run test:all
```

Or run specific test types:

```bash
npm run test          # Unit tests
npm run test:e2e      # E2E tests  
npm run test:coverage # Unit tests with coverage
npm run test:e2e:ui   # E2E tests with UI
```

## 📝 Requirements Specification

Requirements are defined in `requirements/spec.yaml` using this structure:

```yaml
metadata:
  project: "Project Name"
  version: "1.0.0"
  updated: "2025-01-15"

category_name:
  - id: "CAT-001"
    title: "Requirement Title"
    description: "Detailed description"
    priority: "critical" # critical|high|medium|low
    acceptance_criteria:
      - "Specific testable criteria"
      - "Another acceptance criteria"
    test_data:
      field: "value"
```

### Supported Categories

- **authentication** - Login, OAuth, session management
- **listings** - CRUD operations for marketplace items
- **messaging** - Real-time chat and communication
- **profiles** - User profile management  
- **favourites** - Wishlist functionality
- **admin** - Administrative features
- **performance** - Speed and optimization requirements
- **accessibility** - A11y compliance requirements
- **security** - Security and data protection
- **mobile** - Mobile responsiveness requirements

## 🧪 Test Generation

The test generator (`scripts/generate-tests.ts`) automatically creates:

### E2E Tests
- Playwright tests for each requirement
- Cross-browser testing (Chrome, Firefox, Safari)
- Mobile device testing
- Requirement traceability tags (`@req: REQ-001`)

### Unit Tests  
- Vitest tests for component logic
- Testing Library integration
- Mock setup and utilities
- Coverage reporting

### Test Utilities
- Data builders for consistent test data
- Page helpers for common interactions
- Authentication helpers
- API mocking utilities

## 📊 Requirement Traceability

Every generated test includes traceability tags:

```typescript
// @req: AUTH-001
// @priority: critical  
test('User can login with email/OTP', async ({ page }) => {
  // Test implementation
})
```

The requirements report (`tests/requirements-report.html`) provides:
- Complete requirement coverage overview
- Test-to-requirement mapping
- Priority distribution analysis
- Category breakdown

## 🔧 CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/test.yml`) provides:

### Test Generation Stage
- Generates fresh tests from requirements
- Uploads test artifacts
- Creates traceability reports

### Static Analysis Stage  
- TypeScript type checking
- ESLint code quality checks
- Security vulnerability scanning

### Testing Stages
- **Unit Tests** - Component and logic testing with coverage
- **E2E Tests** - Cross-browser end-to-end testing
- **Mobile Tests** - Responsive design validation
- **Performance Tests** - Lighthouse auditing
- **Security Tests** - Vulnerability scanning

### Deployment Stage
- Automatic deployment on successful test completion
- Environment-specific configurations

## 🎯 Best Practices

### Writing Requirements

1. **Atomic** - Each requirement should test one specific capability
2. **Testable** - Acceptance criteria should be verifiable
3. **Prioritized** - Use priority levels for test execution order
4. **Traceable** - Include unique IDs for requirement tracking

### Test Data Management

Use the `TestDataBuilder` for consistent test data:

```typescript
const user = TestDataBuilder.createUser({ email: 'custom@example.com' })
const listing = TestDataBuilder.createListing({ title: 'Custom Product' })
```

### Page Object Helpers

Use `PageHelpers` for common actions:

```typescript
await PageHelpers.loginUser(page, 'test@example.com')
await PageHelpers.createListing(page, testData)
await PageHelpers.searchListings(page, 'electronics')
```

## 📈 Metrics and Reporting

The framework generates comprehensive reports:

### Coverage Reports
- **Unit Test Coverage** - Line, branch, function coverage
- **E2E Coverage** - User journey coverage  
- **Requirement Coverage** - Percentage of requirements tested

### Performance Reports
- **Lighthouse Audits** - Performance, accessibility, SEO scores
- **Bundle Analysis** - JavaScript bundle size tracking
- **Core Web Vitals** - User experience metrics

### Quality Reports
- **Accessibility** - WCAG compliance checking
- **Security** - Vulnerability and dependency audits
- **Code Quality** - ESLint and TypeScript analysis

## 🔄 Continuous Improvement

### Requirement Updates

1. Update `requirements/spec.yaml`
2. Run `npm run generate:tests`  
3. Review and commit generated test changes
4. Update test implementations as needed

### Adding New Test Types

1. Extend the `TestGenerator` class
2. Add new test templates
3. Update CI/CD pipeline
4. Document new test patterns

### Performance Optimization

- Monitor test execution times
- Optimize parallel test execution
- Cache dependencies and artifacts
- Use incremental testing strategies

## 🛠️ Troubleshooting

### Common Issues

**Tests not generating**: Check YAML syntax in requirements file
**E2E tests failing**: Ensure application is running on correct port  
**Coverage issues**: Verify test files are in correct directories
**CI/CD failures**: Check environment variables and secrets

### Debugging

```bash
# Debug test generation
npm run generate:tests -- --verbose

# Debug specific tests  
npx playwright test --debug
npx vitest --reporter=verbose

# Debug performance issues
npm run test:coverage -- --reporter=verbose
```

## 📚 Additional Resources

- [Playwright Documentation](https://playwright.dev/)
- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [YAML Specification](https://yaml.org/spec/)
- [Requirements Engineering Best Practices](https://requirements.org/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add/update requirements in `requirements/spec.yaml`
4. Generate and implement tests
5. Ensure all tests pass
6. Submit a pull request

The testing framework automatically validates all changes against the requirements specification to ensure complete coverage and traceability.