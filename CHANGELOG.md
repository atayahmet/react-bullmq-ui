# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- Unit testing configuration with Jest and React Testing Library
- New test structure with root-level `__tests__` directory
- Example test cases in `__tests__/example.test.tsx`, `__tests__/basic.test.ts` and `__tests__/components/example-component.test.tsx`
- Added unit tests for components:
  - AddJobModal component
  - BullMQJobList component (main component)
  - JobDetailModal component
  - QueueManagementModal component
  - ThemeProvider component (with theme mode tests)
- Added unit tests for utility functions:
  - formatters.ts (`getStatusColor` and `formatTimestamp`)
- Testing scripts in package.json: `test`, `test:watch`, `test:coverage` and `test:debug`
- Added `tsconfig.test.json` for TypeScript test configuration
- Added TypeScript declarations for Jest DOM matchers
- Added component mocking strategy for testing Ant Design components
- Configured Jest to collect coverage from both .ts and .tsx files using `collectCoverageFrom` configuration
- Added component preloading helpers for better coverage reporting of React components:
  - TypeScript direct import helper (ts-coverage-helper.ts)
  - Dynamic import helper (component-loader.js)
  - Legacy jest.requireActual helper (load-components.js)

### Fixed
- Updated Jest configuration for proper coverage of both .ts and .tsx files
  - Modified `collectCoverageFrom` to use combined file pattern for TypeScript files
  - Added explicit coverage reporters configuration for better reporting options
  - Removed invalid `collectAllSourceFiles` option that was causing validation warnings
- Improved Jest setup with proper TypeScript integration
- Fixed TypeScript errors in test files with proper type imports
- Enhanced Jest configuration for better compatibility with TypeScript and React
- Fixed issue with zero coverage reporting for .tsx files despite having tests
  - Added component preloading mechanism in jest.setup.js
  - Implemented load-components.js helper to ensure all components are included in coverage reports
  - Created enhanced component-loader.js with improved dynamic import approach
  - Fixed path resolution issues in component loaders
  - Added detailed error logging for better troubleshooting of coverage issues
- Fixed coverage report showing .test.tsx files instead of the actual component files
  - Created enhanced coverage script that properly focuses on source files
  - Updated ts-coverage-helper.ts to actually render components with props
  - Added new test:coverage:enhanced script to package.json
  - Fixed coveragePathIgnorePatterns to properly exclude test files