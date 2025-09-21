## Generic Service Layer Implementation Plan

### 1. Create Base Repository Infrastructure

Create the foundational files in `src/services/`:

**1.1 Create `src/services/types.tsx`**
- Define generic repository interfaces and common entity types
- Include base CRUD operations: `create`, `read`, `update`, `delete`/`archive`
- Define error handling types and response wrappers
- Include pagination and filtering interfaces for future scalability

**1.2 Create `src/services/base/BaseRepository.tsx`**
- Implement abstract base class with common Firestore operations
- Include generic CRUD methods that specific repositories can extend
- Handle error conversion from Firestore exceptions to plain JavaScript errors
- Ensure all returned data are plain JavaScript objects, never Firestore types

### 2. Implement Configuration and Utilities

**2.1 Create `src/services/config.tsx`**
- Define collection names and database configuration constants
- Include environment-specific settings
- Set up common query builders and validators

**2.2 Create `src/services/utils/dataTransformers.tsx`**
- Implement utilities to convert Firestore documents to plain objects
- Handle timestamp conversions and data sanitization
- Include validation helpers for incoming and outgoing data

### 3. Create Feature-Specific Service Implementation

**3.1 Create `src/services/petService.tsx`**
- Extend the base repository for pet-specific operations
- Implement `getList`, `getById`, `create`, `update`, `archive` methods
- Include pet-specific queries (active vs archived pets)
- Handle pet data validation and transformation
- Return typed Pet objects as defined in `src/features/petManagement/types.tsx` [1]

### 4. Establish Domain Types Structure

**4.1 Update `src/features/petManagement/types.tsx`**
- Consolidate all pet-related types as mentioned in requirements [2]
- Define Pet entity interface with all required fields
- Include repository output types and API response interfaces
- Add validation schemas for pet creation and updates

**4.2 Create `src/types/common.tsx`**
- Define shared domain types used across multiple features
- Include common response wrappers, pagination types, and error interfaces
- Define base entity properties (id, createdAt, updatedAt, etc.)

### 5. Implement Custom React Hooks

**5.1 Create `src/features/petManagement/hooks/`**
- Implement `usePetList.tsx` for fetching and managing pet lists
- Create `useAddPet.tsx` for pet creation with optimistic updates
- Develop `useEditPet.tsx` for pet updates
- Build `useArchivePet.tsx` for soft delete operations
- Ensure hooks only depend on service modules, never directly on Firestore SDK [1]

### 6. Set Up Testing Infrastructure

**6.1 Create `src/services/__tests__/`**
- Implement mock data generators for pets and other entities
- Create service layer unit tests with mocked Firestore operations
- Test error handling and data transformation logic
- Ensure tests demonstrate backend-independence as required [1]

**6.2 Create `src/features/petManagement/__tests__/`**
- Test custom hooks with mocked service dependencies
- Validate hook behavior under various loading and error states
- Test component integration with hooks using the shared render wrapper [1]

### 7. Add Path Alias Support

**7.1 Update TypeScript configuration**
- Add `@services/*` alias to `tsconfig.app.json` to match existing pattern [1]
- Ensure consistent import paths across the application

### 8. Create Developer Documentation

**8.1 Create `src/services/README.md`**
- Document the data access pattern and service layer architecture
- Explain directory layout and naming conventions
- Provide examples of creating new feature-specific services
- Include testing guidelines and mock usage patterns

**8.2 Update existing documentation**
- Add service layer examples to main guidelines [1]
- Document the relationship between services, hooks, and components
- Include troubleshooting section for common service layer issues

### 9. Integration and Migration

**9.1 Update existing components**
- Ensure all components use hooks instead of direct Firestore calls
- Migrate any existing pet management logic to use the new service pattern
- Validate that no components import Firestore SDK directly [1]

**9.2 Store integration**
- Update Zustand stores to use service methods for async operations [1]
- Ensure stores remain focused and don't duplicate service logic

### 10. Validation and Quality Assurance

**10.1 Run comprehensive tests**
- Execute `npm run test:coverage` to ensure adequate test coverage [3]
- Validate that all service methods work with mocked data
- Test error scenarios and edge cases

**10.2 Code quality checks**
- Run `npm run lint` and `npm run format` to maintain code standards [3]
- Ensure strict TypeScript compliance throughout the service layer
- Validate that all public APIs have explicit type definitions [1]

This implementation plan follows the established project conventions, including the feature-first organization, strict TypeScript usage, comprehensive testing with Vitest, and the data access strategy outlined in the guidelines [1][2]. The service layer will provide a clean abstraction over Firestore while maintaining testability and supporting future feature development.
