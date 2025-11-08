### Objective

Implement user-defined tags for pets, stored in Firestore via repositories/services, editable in forms, and displayed as
chips on PetCard. Follow feature-first structure, i18n, and testing guidelines.

### Acceptance Criteria

- Pet model includes `tags: string[]` (normalized to `[]`).
- Users can add/remove arbitrary tags while creating/editing a pet.
- Tags are persisted in Firestore on the pet document.
- Tags render as chips on `PetCard` and in Pet Details.
- Unit/component tests cover display and editing interactions.
- No Firestore SDK is used directly in components; only via repository/service.

### Step 0 — Prep and Branch

- Create a feature branch, e.g., `feature/pet-tags`.
- Ensure `npm run build` passes on main before starting.

### Step 1 — Update Pet model

- File: `src/models/pet.tsx`
- Add `tags: string[]` to `Pet` interface. If the file or type already exists, extend it; otherwise, create the file.

```ts
export interface Pet {
  id: string;
  name: string;
  // ...existing fields
  tags: string[]; // always normalized to [] when missing
}
```

### Step 2 — Repository: CRUD support and normalization

- File: `src/repositories/PetRepository.tsx`
- Add a `sanitizeTags(tags: string[]): string[]` helper: trim, dedupe, limit length (<= 24) and count (<= 10).
- Ensure `getById`, `create`, and `update` normalize/clean `tags` to an array.
- Add a dedicated `setTags(petId: string, tags: string[])` method.

```ts
function sanitizeTags(tags: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of tags ?? []) {
    const t = String(raw).trim();
    if (!t || t.length > 24 || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out.slice(0, 10);
}

export const PetRepository = {
  async getById(id: string): Promise<Pet | null> {
    /* normalize tags */
  },
  async setTags(id: string, tags: string[]): Promise<void> {
    /* updateDoc({ tags: sanitizeTags(tags) }) */
  },
  async create(id: string, pet: Omit<Pet, 'id'>): Promise<void> {
    /* ensure tags written */
  },
  async update(id: string, patch: Partial<Pet>): Promise<void> {
    /* ensure tags sanitized if present */
  },
};
```

Notes:

- Keep returns as plain JS objects.
- Don’t leak Firestore types outside repositories.

### Step 3 — Service layer

- File: `src/services/petService.tsx`
- Expose `getById`, `setTags`, `addTag`, `removeTag` that internally call `PetRepository`.

```ts
export const petService = {
  getById: (id: string) => PetRepository.getById(id),
  setTags: (id: string, tags: string[]) => PetRepository.setTags(id, tags),
  async addTag(id: string, tag: string) {
    const pet = await PetRepository.getById(id);
    if (!pet) throw new Error('Pet not found');
    return PetRepository.setTags(id, [...pet.tags, tag]);
  },
  async removeTag(id: string, tag: string) {
    const pet = await PetRepository.getById(id);
    if (!pet) throw new Error('Pet not found');
    return PetRepository.setTags(
      id,
      pet.tags.filter((t) => t !== tag)
    );
  },
};
```

### Step 4 — Store (if applicable)

- File: `src/store/petsStore.tsx` (or the relevant store)
- Ensure state shape for `Pet` includes `tags`.
- Add actions: `setTags(petId, tags)` that call `petService.setTags` and patch local state.
- Prefer selectors to limit component dependencies, e.g., `usePetStore((s) => s.pets)`.

### Step 5 — i18n strings

- File: `src/locales/en/petProperties.json` (and other locales as needed)
- Add keys:

```json
{
  "tags": {
    "label": "Tags",
    "placeholder": "Add a tag"
  }
}
```

- If you want overflow chip a11y text: add to `common.json` or `petProperties.json`:

```json
{
  "tags": {
    "more": "+{{count}}",
    "moreAria": "and {{count}} more tags"
  }
}
```

### Step 6 — Tags editor UI component

- File: `src/features/pets/components/PetTagsEditor.tsx`
- Implement an input that supports free-form, multiple tags (MUI `Autocomplete` multiple + freeSolo or a minimal custom
  input). Keep it stateless: `value` + `onChange`.

```tsx
import { Autocomplete, Chip, TextField } from '@mui/material';
import { useTranslation } from 'react-i18next';

type Props = { value: string[]; onChange: (tags: string[]) => void };

export function PetTagsEditor({ value, onChange }: Props) {
  const { t } = useTranslation('petProperties');
  return (
    <Autocomplete
      multiple
      freeSolo
      options={[]}
      value={value}
      onChange={(_, next) => onChange((next as string[]) ?? [])}
      renderTags={(tagValue, getTagProps) =>
        tagValue.map((option, index) => (
          <Chip
            size="small"
            variant="outlined"
            label={option}
            {...getTagProps({ index })}
          />
        ))
      }
      renderInput={(params) => (
        <TextField
          {...params}
          label={t('tags.label')}
          placeholder={t('tags.placeholder')}
        />
      )}
    />
  );
}
```

### Step 7 — Integrate editor into Create/Edit Pet form

- Files: wherever your pet create/edit form lives (e.g., `src/features/pets/pages/EditPetPage.tsx` or component under
  `src/features/pets/components/`).
- Wire `PetTagsEditor` into the form state:
  - Initialize form `tags` with `pet.tags ?? []` (for edit) or `[]` (for create).
  - On save, call `petService.setTags(petId, tags)` alongside other pet fields.
  - Consider optimistic UI: update store immediately after success.

### Step 8 — Display tags on PetCard

- File: `src/features/pets/components/PetCard.tsx`
- Render chips if `pet.tags.length > 0`.
- Cap to a small number for compact cards (e.g., 5) with a "+N" overflow chip.

```tsx
import { Chip, Stack } from '@mui/material';

// inside the component render:
const tags = pet.tags ?? [];
{
  tags.length > 0 && (
    <Stack
      direction="row"
      spacing={1}
      useFlexGap
      flexWrap="wrap"
      sx={{ mt: 1 }}
    >
      {tags.slice(0, 5).map((tag) => (
        <Chip key={tag} size="small" label={tag} />
      ))}
      {tags.length > 5 && (
        <Chip
          size="small"
          variant="outlined"
          label={`+${tags.length - 5}`}
          aria-label={`and ${tags.length - 5} more tags`}
        />
      )}
    </Stack>
  );
}
```

- For `PetDetailsPage.tsx`, display all tags using a wrapping layout.

### Step 9 — Feature flag (optional)

- Add `VITE_PET_TAGS_ENABLED=true` to `.env`.
- Map to a flag in your provider and gate UI:
  - Hide `PetTagsEditor` and chips when disabled.
  - Tests should verify both enabled/disabled states.

### Step 10 — Tests (Vitest + Testing Library)

- Use `@test-utils` render wrapper, `user-event` for interactions.
- Avoid snapshots; assert visible text/roles.

1. `PetCard` displays tags

- File: `src/features/pets/components/PetCard.test.tsx`

```tsx
test('renders pet tags as chips', () => {
  const pet = { id: '1', name: 'Rex', tags: ['Friendly', 'Shy'] } as any;
  render(<PetCard pet={pet} />);
  expect(screen.getByText('Friendly')).toBeVisible();
  expect(screen.getByText('Shy')).toBeVisible();
});
```

2. `PetTagsEditor` interaction

- File: `src/features/pets/components/PetTagsEditor.test.tsx`

```tsx
test('allows adding free-form tags', async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  render(<PetTagsEditor value={[]} onChange={onChange} />);
  const input = screen.getByLabelText(/tags/i);
  await user.type(input, 'Friendly{enter}');
  expect(onChange).toHaveBeenCalledWith(['Friendly']);
});
```

3. Form save flows (integration)

- Mock `petService.setTags` or `PetRepository.setTags` via `vi.mock`.
- Render the Edit/Create form, set tags, submit, assert service call with sanitized tags.

4. Store action (if using Zustand)

- Mock store or inject initial state; assert that after calling `setTags`, the store state updates the relevant pet.

5. Feature flag tests (if enabled)

- Render with `<FeatureFlagsProvider initialFlags={{ pet_tags_enabled: false }}>` and assert tags UI is hidden.

### Step 11 — Firestore security rules

- Update rules (illustrative):

```js
allow
update: if request.resource.data.tags is
list &&
request.resource.data.tags.size() <= 10 &&
request.resource.data.tags.every(tag => tag
is
string && tag.size() <= 24
)
;
```

- Adjust to your existing auth/ownership checks.

### Step 12 — Styling and a11y

- Prefer MUI `sx` for spacing; use CSS modules only if custom styles are needed.
- Overflow "+N" chip should have an `aria-label` describing count.
- Editor input has accessible label and placeholder via i18n.

### Step 13 — Manual QA checklist

- Create a pet; add multiple tags; save; reload; tags persist.
- Edit an existing pet; add/remove tags; save; verify chips update.
- Try duplicate/empty/overly-long tags; verify they’re trimmed, deduped, and capped.
- Keyboard-only input (Enter to add, Backspace to remove) works.
- Feature flag off hides all tag UI (if implemented).
- No console errors; build passes.

### Step 14 — Docs and cleanup

- Update `docs/user-defined-tags.feature.md` with final behavior and screenshots.
- Ensure `npm run lint`, `npm run format`, `npm run test`, and `npm run build` all pass.
- Open PR with a summary and checklist:
  - Tests added/updated
  - Build/lint/format pass
  - i18n keys present
  - Feature flags applied (if any)

### Notes on Structure & Conventions

- Keep `PetTagsEditor.tsx` colocated with related components under `src/features/pets/components/`.
- Export minimal public APIs from index files if the module grows.
- All new TS files should use `.tsx` extension as per project rules.

### Suggested Task Breakdown (for tickets)

- DEV-1: Model + repository + service support for tags
- DEV-2: Tags editor component with i18n
- DEV-3: Integrate tags editor into Create/Edit Pet form
- DEV-4: Render tags on PetCard and Pet Details
- DEV-5: Tests (unit + integration) and feature flag coverage
- DEV-6: Firestore rule updates + documentation

This step-by-step plan aligns with your feature-first organization, abstracts Firestore via repositories/services, and
includes the testing and i18n practices from your guidelines.
