### Edit/Delete Actions — Step-by-Step Task List

Target file for this checklist: `docs/edit-delete-action-tasks.md`

---

### Scope and Goals

- Implement real Edit and Delete flows for pets.
- Use a modal `PetForm` for editing and `ConfirmModal` for delete confirmation.
- Keep Firestore access behind `@services/petService`.
- Ensure components are i18n-ready and feature-flag aware.
- Add reliable unit/integration tests with mocked services.

---

### Prerequisites

- Ensure feature flag exists for actions (e.g., `petActionsEnabled`).
- Confirm `PetForm`, `Modal`, and `ConfirmModal` components exist or plan to create stubs.

---

### 1) Service Layer

- [ ] Create or update `src/services/petService.ts` to include update/delete APIs.
  - [ ] Add types and functions:

    ```ts
    import type { Pet } from '@features/pets/types';

    export type UpdatePetInput = Omit<Pet, 'id'>; // adjust to the editable fields

    export const petService = {
      async getList(): Promise<Pet[]> {
        // existing or placeholder implementation
        return [];
      },
      async updatePet(id: Pet['id'], data: UpdatePetInput): Promise<Pet> {
        // Firestore update logic; returns updated Pet (plain object)
        return { id, ...data } as Pet;
      },
      async deletePet(id: Pet['id']): Promise<void> {
        // Firestore delete logic
      },
    };
    ```

  - [ ] Keep SDK specifics internal; return plain JS objects only.
  - [ ] Export the minimal API from this module.

---

### 2) Row Component — Surface Intent Only

- File: `src/features/petManagement/components/PetListRow.tsx`
- [ ] Update props to accept callbacks and remove inline `alert(...)` logic.
  - [ ] Change props:
    ```ts
    type PetListRowProps = {
      pet: Pet;
      onEdit?: (pet: Pet) => void;
      onDelete?: (pet: Pet) => void;
    };
    ```
  - [ ] Wire handlers:
    ```ts
    const editClick = () => onEdit?.(pet);
    const deleteClick = () => onDelete?.(pet);
    ```
  - [ ] Keep feature flag gating for the action buttons:
    - `useFeatureFlag('petActionsEnabled')`
  - [ ] Ensure buttons have accessible names via i18n: `t('edit', { ns: 'common' })`, `t('delete', { ns: 'common' })`.

---

### 3) Pet List — Orchestrate Modals and Mutations

- File: `src/features/petManagement/components/PetList.tsx`
- [ ] Add state for modal orchestration and network status:
  ```ts
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [deletingPet, setDeletingPet] = useState<Pet | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  ```
- [ ] Pass callbacks to `PetListRow`:
  ```tsx
  <PetListRow pet={pet} onEdit={setEditingPet} onDelete={setDeletingPet} />
  ```
- [ ] Render Edit modal with `PetForm` when `editingPet` is set:
  ```tsx
  {
    editingPet && (
      <Modal
        title={t('editPetTitle', { ns: 'petList' })}
        onClose={() => setEditingPet(null)}
      >
        <PetForm
          initialValues={{
            name: editingPet.name,
            breed: editingPet.breed /* ... */,
          }}
          onSubmit={submitEdit}
          onCancel={() => setEditingPet(null)}
          submitting={saving}
        />
      </Modal>
    );
  }
  ```
- [ ] Implement `submitEdit` to call `petService.updatePet` and update local list state, then close modal. Show error on
      failure and keep modal open.
  ```ts
  const submitEdit = async (values: Omit<Pet, 'id'>) => {
    if (!editingPet) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await petService.updatePet(editingPet.id, values);
      setPets((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setEditingPet(null);
    } catch (e) {
      setError(t('errors.updateFailed', { ns: 'common' }));
    } finally {
      setSaving(false);
    }
  };
  ```
- [ ] Render Delete confirmation when `deletingPet` is set:
  ```tsx
  {
    deletingPet && (
      <ConfirmModal
        title={t('confirmDeleteTitle', { ns: 'common' })}
        message={t('confirmDeleteMessage', {
          ns: 'common',
          petName: deletingPet.name,
        })}
        confirmText={t('delete', { ns: 'common' })}
        cancelText={t('cancel', { ns: 'common' })}
        onConfirm={confirmDelete}
        onCancel={() => setDeletingPet(null)}
        busy={saving}
      />
    );
  }
  ```
- [ ] Implement `confirmDelete` to call `petService.deletePet`, update list, then close modal. Show error on failure and
      keep modal open.
  ```ts
  const confirmDelete = async () => {
    if (!deletingPet) return;
    setSaving(true);
    setError(null);
    try {
      await petService.deletePet(deletingPet.id);
      setPets((prev) => prev.filter((p) => p.id !== deletingPet.id));
      setDeletingPet(null);
    } catch (e) {
      setError(t('errors.deleteFailed', { ns: 'common' }));
    } finally {
      setSaving(false);
    }
  };
  ```
- [ ] Show an inline alert region for `error` (e.g., `<div role="alert">{error}</div>`).
- [ ] Keep namespace loading and feature flags as-is.

---

### 4) PetForm Contract (if not present)

- File: `src/features/petManagement/components/PetForm.tsx`
- [ ] Ensure `PetForm` accepts:
  - `initialValues: Omit<Pet, 'id'>`
  - `onSubmit(values: Omit<Pet, 'id'>): void | Promise<void>`
  - `onCancel(): void`
  - `submitting?: boolean` (disables submit button)
- [ ] Implement controlled fields matching editable `Pet` properties.
- [ ] Do not include Firestore logic in this component.

---

### 5) i18n Updates

- [ ] Add/verify keys in `src/locales/<lang>/common.json`:
  - `edit`
  - `delete`
  - `cancel`
  - `confirmDeleteTitle`
  - `confirmDeleteMessage` (example: `"Delete {{petName}}? This action cannot be undone."`)
  - `errors.updateFailed`
  - `errors.deleteFailed`
- [ ] Add/verify keys in `src/locales/<lang>/petList.json`:
  - `editPetTitle`
- [ ] Ensure components call `useTranslation` with correct namespaces.

---

### 6) Feature Flag

- [ ] Confirm a `petActionsEnabled` flag exists in `src/featureFlags/config.ts` (default may come from env `VITE_*`).
- [ ] Update tests to cover both `true` and `false` cases.

---

### 7) Testing — Vitest + Testing Library

Use `render` from `@test-utils` and mock services.

- Row tests: `src/features/petManagement/components/PetListRow.test.tsx`
  - [ ] Renders Edit/Delete buttons when `petActionsEnabled=true`; hides when `false`.
  - [ ] Clicking Edit calls `onEdit` with the `pet`.
  - [ ] Clicking Delete calls `onDelete` with the `pet`.

- List integration tests: `src/features/petManagement/components/PetList.test.tsx`
  - [ ] Mock `@services/petService`:
    ```ts
    vi.mock('@services/petService', () => ({
      petService: {
        getList: vi
          .fn()
          .mockResolvedValue([{ id: '1', name: 'Fido', breed: 'Mix' }]),
        updatePet: vi
          .fn()
          .mockResolvedValue({ id: '1', name: 'Rex', breed: 'Mix' }),
        deletePet: vi.fn().mockResolvedValue(undefined),
      },
    }));
    ```
  - Edit flow
    - [ ] Click Edit opens modal (`getByRole('dialog')`).
    - [ ] Fields pre-populated with pet values.
    - [ ] Change a field and submit: assert `petService.updatePet` called with `id` and values, list updates, modal
          closes.
    - [ ] Cancel closes modal and does not call service.
  - Delete flow
    - [ ] Click Delete opens confirm dialog.
    - [ ] Decline closes modal and does not call service.
    - [ ] Confirm calls `deletePet` with `id`, removes row, closes modal.
  - Error cases
    - [ ] `updatePet` rejects → show error alert, keep edit modal open.
    - [ ] `deletePet` rejects → show error alert, keep confirm modal open.
  - Feature flag gating
    - [ ] With `petActionsEnabled=false`, action buttons are not rendered.

- [ ] Run `npm run test` and `npm run test:coverage` to verify passing tests and coverage.

---

### 8) Type Safety and Linting

- [ ] Keep TypeScript strict; explicitly type `Pet`, `UpdatePetInput`, state setters.
- [ ] Run `npm run lint` and `npm run format` and fix issues.

---

### 9) Accessibility and UX

- [ ] Buttons have accessible names via i18n.
- [ ] Modals use appropriate roles (`dialog`), focus management, and ESC/overlay close as supported by the common
      components.
- [ ] Disable action buttons while `saving` to prevent duplicate submissions.

---

### 10) Env and Config (if needed)

- [ ] If adding a new flag, update `.env.local` with defaults (restart dev server after changes).

---

### 11) Acceptance Criteria

- [ ] Edit opens `PetForm` modal with current pet values; submit updates list, cancel closes without saving.
- [ ] Delete opens `ConfirmModal`; decline closes without action; confirm deletes and removes the row.
- [ ] All user-facing strings are i18n-managed.
- [ ] No component directly imports Firestore SDK; all data ops use `petService`.
- [ ] Tests cover key flows and error cases; CI is green.

---

### 12) Suggested Commit Breakdown

- [ ] feat(services): add `updatePet` and `deletePet` to `petService`
- [ ] refactor(PetListRow): surface `onEdit`/`onDelete` callbacks; remove alerts
- [ ] feat(PetList): orchestrate edit/delete modals and wire to `petService`
- [ ] feat(i18n): add missing keys for edit/delete flows
- [ ] test(PetListRow): add unit tests for action callbacks and flags
- [ ] test(PetList): add integration tests for edit/delete and errors
- [ ] chore(lint): formatting and minor type improvements

---

### Notes

- Keep UI small and stateless; put orchestration in `PetList` and data in `petService`.
- If a shared `usePetList` hook emerges, refactor later to lift fetching and local updates into it, keeping this change
  focused now.
