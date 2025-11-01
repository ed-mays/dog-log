## Generic Service Layer Implementation Plan

### 1. Create Base Repository Infrastructure

Create the foundational files in `src/repositories/`:

**[Done] 1.1 Create `src/repositories/types.ts`**

- Define generic repository interfaces and common entity types
- Include base CRUD operations: `create`, `read`, `update`, `delete`/`archive`
- Define error handling types and response wrappers
- Include pagination and filtering interfaces for future scalability

**[Done] 1.2 Create `src/repositories/base/BaseRepository.ts`**

- Implement abstract base class with common Firestore operations
- Include generic CRUD methods that specific repositories can extend
- Handle error conversion from Firestore exceptions to plain JavaScript errors
- Ensure all returned data are plain JavaScript objects, never Firestore types

### 2. Implement Repository Configuration and Utilities

**2.1 Create `src/repositories/config.ts`**

- Define collection names and database configuration constants.
- Include environment-specific settings.
- Set up common query builders and validators for repository usage.

**2.2 Create `src/repositories/utils/dataTransformers.ts`**

- Implement utilities to convert Firestore documents to plain objects in repositories.
- Handle timestamp conversions and data sanitization, scoped for repository logic.
- Include validation helpers to support repository-level data requirements.

_Repositories and related utilities are located in `src/repositories/`, while services for business logic reside
in `src/services/` as distinct layers._

### 3. Create Feature-Specific Service Implementation

**3.1 Create `src/services/petService.test.ts`**

- Extend the base repository for pet-specific operations
- Implement `getList`, `getById`, `create`, `update`, `archive` methods
- Include pet-specific queries (active vs archived pets)
- Handle pet data validation and transformation
- Return typed Pet objects as defined in `src/features/petManagement/types.ts`

### 4. Establish Domain Types Structure

**4.1 Update `src/features/petManagement/types.ts`**

- Consolidate all pet-related types as mentioned in requirements
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
- Ensure hooks only depend on service modules, never directly on Firestore SDK

### 6. Set Up Testing Infrastructure

**6.1 Repository tests**

- Place repository tests alongside their implementation files (e.g. `src/repositories/base/BaseRepository.test.ts` next
  to `BaseRepository.ts`)
- Place feature repository tests alongside their implementation (e.g. `src/repositories/petRepository.test.ts` next to
  `petRepository.tsx`)
- Implement mock data generators for pets and other entities
- Create repository layer unit tests with mocked Firestore operations
- Test error handling and data transformation logic
- Ensure tests demonstrate backend-independence as required

**6.2 Service tests**

- Place service tests alongside their implementation files (e.g. `src/services/petService.test.ts` next to
  `petService.test.ts`)
- Test business logic and service layer functionality
- Mock repository dependencies to isolate service logic
- Validate complex business rules and cross-cutting concerns

**6.3 Hook tests**

- Place hook tests alongside their implementation (e.g. `src/features/petManagement/hooks/usePetList.test.tsx` next to
  `usePetList.tsx`)
- Test custom hooks with mocked service dependencies
- Validate hook behavior under various loading and error states
- Test component integration with hooks using the shared render wrapper

### 7. Add Path Alias Support

**7.1 Update TypeScript configuration**

- Add `@services/*` alias to `tsconfig.app.json` to match existing pattern
- Ensure consistent import paths across the application

### 8. Create Developer Documentation

**8.1 Create `src/services/README.md`**

- Document the data access pattern and service layer architecture
- Explain directory layout and naming conventions
- Provide examples of creating new feature-specific services
- Include testing guidelines and mock usage patterns

**8.2 Update existing documentation**

- Add service layer examples to main guidelines
- Document the relationship between services, hooks, and components
- Include troubleshooting section for common service layer issues

### 9. Integration and Migration

**9.1 Update existing components**

- Ensure all components use hooks instead of direct Firestore calls
- Migrate any existing pet management logic to use the new service pattern
- Validate that no components import Firestore SDK directly

**9.2 Store integration**

- Update Zustand stores to use service methods for async operations
- Ensure stores remain focused and don't duplicate service logic

### 10. Validation and Quality Assurance

**10.1 Run comprehensive tests**

- Execute `npm run test:coverage` to ensure adequate test coverage
- Validate that all service methods work with mocked data
- Test error scenarios and edge cases

**10.2 Code quality checks**

- Run `npm run lint` and `npm run format` to maintain code standards
- Ensure strict TypeScript compliance throughout the service layer
- Validate that all public APIs have explicit type definitions

This implementation plan follows the established project conventions, including the feature-first organization, strict
TypeScript usage, comprehensive testing with Vitest, and the data access strategy outlined in the guidelines. The
service layer will provide a clean abstraction over Firestore while maintaining testability and supporting future
feature development.
