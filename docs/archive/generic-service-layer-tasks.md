## Actionable Implementation Tasks for Revised Service Layer

### 1. Repository Layer Setup

- [x] Create `src/repositories/types.ts` with base entity and repository interfaces.
- [x] Create `src/repositories/base/BaseRepository.ts` as the abstract, generic repository (CRUD, error conversion,
      transformations).
- [x] Place repository unit tests (e.g. `BaseRepository.test.ts`) directly alongside their implementations using
      Vitest, with backend-independence and no **tests** folders.

### 2. Repository Configuration and Utilities

- [x] Create `src/repositories/config.ts` for collection names, database constants, and environment configs.
- [x] Implement query builders and validators in `config.ts` as needed for repository logic.
- [x] Create `src/repositories/utils/dataTransformers.tsx` for converting Firestore documents, handling timestamps, and
      data sanitization.
- [x] Add repository-level validation helpers in `dataTransformers.tsx` or separate utils.
- [x] Write unit tests for all repository utilities and config functions as co-located `.test.tsx` files next to their
      code.

### 3. Feature-Specific Repository and Service Development

- [x] Implement pet repository in `src/repositories/petRepository.tsx` extending `BaseRepository`, with its test in
      `petRepository.test.ts`.
- [x] Implement pet feature service in `src/services/petService.tsx` that uses the pet repository for business logic,
      with its test in `petService.test.tsx`.
- [x] Add typed Pet definitions to `src/features/petManagement/types.ts`.
- [ ] Implement pet validation and transformation functions within the repository (with tests next to these functions).
- [ ] Create and export feature-related queries (e.g. active/archived pets) from the repository.

### 4. Domain Types and Common Utilities

- [x] Update or create `src/features/petManagement/types.ts` with all pet domain types and API interfaces.
- [ ] Add reusable API and entity types in `src/types/common.tsx`.

### 5. React Hooks Layer

- [ ] Implement hooks in `src/features/petManagement/hooks/` (e.g. `usePetList.tsx`, `useAddPet.tsx`, `useEditPet.tsx`,
      `useArchivePet.tsx`), keeping tests (e.g. `usePetList.test.tsx`) in the same directory.
- [ ] Ensure all hooks use services (not repositories or Firestore directly).
- [ ] Test hooks using mocked services for loading/error state.

### 6. Testing and Test Utilities

- [ ] Create mock data generators for pets/entities in the same directory as repository implementations.
- [ ] Write service layer tests and repository tests as `.test.tsx` files in the same directories as their
      implementations.
- [ ] Test error handling, validation, and transformation logic at repository and service layers in their respective
      co-located test files.
- [ ] Test hooks with the shared render wrapper and translation/test-utils, following the local test placement pattern.

### 7. Path Aliases and TypeScript Configuration

- [ ] Update `tsconfig.app.json` to add and verify path aliases for `@repositories/*` and `@services/*`.
- [ ] Refactor imports in all app files to use path aliases.

### 8. Developer Documentation

- [ ] Document repository and service architecture in `src/repositories/README.md` and `src/services/README.md`.
- [ ] Add code/usage examples and testing patterns to these documentation files.
- [ ] Update `guidelines.md` and repo `README.md` to show the new co-located test structure and conventions.

### 9. Integration and Store Update

- [ ] Audit components and refactor them to use hooks only (no direct Firestore/SDK/repository imports).
- [ ] Migrate any remaining business/domain logic into repository and service layers.
- [ ] Refactor Zustand stores in `src/store/` to use service methods and avoid logic duplication.

### 10. Validation, Linting, and Quality Assurance

- [ ] Execute full test suite, including coverage (`npm run test:coverage`).
- [ ] Validate repository/service error and edge case handling.
- [ ] Run `npm run lint` and `npm run format` for code and style consistency.
- [ ] Ensure strict TypeScript compliance and annotate all public APIs and exports.

---

Tests and test utilities should always be co-located with their implementation within the relevant feature, repository,
service, or hook folders. This matches both your actual project guidance and the co-location convention seen in
`README.md` and `guidelines.md`.
