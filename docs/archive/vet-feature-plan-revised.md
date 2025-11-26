Veterinarians Feature - Completion Implementation Plan
This plan completes the partially implemented veterinarians feature based on the original plan in
docs/vets-feature.plan.md
.

User Review Required
IMPORTANT

This plan implements 5 phases to complete the vets feature:

Phase 1: Cleanup Slice 2 (telemetry, deprecation fixes)
Phase 2: Complete Pet UI integration (cards/details show vet links)
Phase 3: Role management UI (manual primary vet selection)
Phase 4: Search polish (enhanced filtering)
Phase 5: Hardening (edge cases, docs, final tests)
Estimated Effort: 11-18 hours total

Phases 2 and 3 deliver the most user-facing value. Phases 1, 4, and 5 are polish/quality work.

Phase 1: Complete Slice 2 Cleanup (HIGH PRIORITY)
Goal: Address remaining Slice 2 items from plan appendix.

Component 1: Telemetry Events
[MODIFY]
AddVetPage.tsx
Add vet_created telemetry event on successful form submission
Pattern: dynamic import analytics, fire after navigation, wrap in try/catch
Follow existing pattern from PetForm vet linking (lines 169-176 in PetForm.tsx)
[MODIFY]
EditVetPage.tsx
Add vet_updated telemetry event on successful form submission
Same pattern as AddVetPage
Fix error i18n key: change common:error.generic to common:somethingWentWrong
[MODIFY]
AddVetPage.test.tsx
Add test: "fires vet_created telemetry on successful submit"
Mock @services/analytics/analytics module
Assert track('vet_created') was called
[MODIFY]
EditVetPage.test.tsx
Add test: "fires vet_updated telemetry on successful submit"
Mock analytics module
Assert track('vet_updated') was called
Component 2: MUI Grid Deprecation Fixes
[MODIFY]
VetForm.tsx
Update MUI Grid v1 props to Grid v2
Remove deprecated item, xs, sm props
Use container and size props instead
Alternative: replace with Box layout for simplicity
Verify no console warnings in tests
Component 3: Integration Test
[NEW] Test in
VetListPage.test.tsx
Add integration test: "shows newly created vet after navigation and search"
Mock vetService.createVet to resolve
Mock vetService.searchVets to return new vet
Navigate to /vets and verify new vet appears in list
Phase 2: Complete Slice 3 Pet UI Integration (CRITICAL)
Goal: Display vet links on PetCard and PetDetailsPage per original plan.

Component 1: PetCard Vet Chips
[MODIFY]
PetCard.tsx
Add feature flag checks (vetsEnabled && vetLinkingEnabled)
Load pet's vet links using petVetService.getPetVets(userId, petId)
Display chips below breed showing "Vet Name — Role"
Use same chip pattern as PetForm (lines 180-215 in PetForm.tsx)
Handle loading state
Add accessible labels
[MODIFY]
PetCard.test.tsx
Add test with flags off: "does not show vet chips when flags disabled"
Add test with flags on: "displays vet chips with Name — Role format"
Mock petVetService.getPetVets to return test data
Assert chips render with correct labels
Component 2: PetDetailsPage Vet Links Section
[MODIFY]
PetDetailsPage.tsx
Add feature flag checks
Load vet links using petVetService.getPetVets(userId, petId)
Add new section after pet properties table
Display list of linked vets with:
Vet name as link to /vets/:vetId/edit
Role label next to name
Use MUI List/ListItem components
Add "Linked Veterinarians" heading (i18n)
Handle empty state ("No linked vets")
[MODIFY]
PetDetailsPage.test.tsx
Add test: "shows linked vets section when flags enabled and links exist"
Mock petVetService.getPetVets
Assert vet names render
Assert links navigate to /vets/:id/edit
Add test: "does not show vet section when flags disabled"
Add test: "shows 'No linked vets' when pet has no vet links"
Phase 3: Implement Slice 4 Role Management (CRITICAL)
Goal: Allow users to manually set primary vet with role dropdown UI.

Component 1: Role Selector in PetForm
[MODIFY]
PetForm.tsx
Add MUI Select dropdown to each vet chip (or adjacent to it)
Options: primary, specialist, emergency, other
Use i18n keys: veterinarians:link.role.primary etc.
On role change to 'primary':
Call petVetService.setPrimaryVet(userId, petId, linkId)
Refresh links to show updated roles
Fire vet_primary_set telemetry event
Display current role in chip label
Consider UX: dropdown could be inline in chip or in a list view
Design Decision Needed:

Option A: Keep chips, add dropdown button that opens menu
Option B: Convert to List with role dropdowns
Option C: Expandable chips with inline dropdown
Recommendation: Option B (List view) for better UX with role management

[MODIFY]
PetForm.link.test.tsx
Add test: "changing role to primary calls setPrimaryVet and fires telemetry"
Mock petVetService.setPrimaryVet
Mock analytics
Simulate role dropdown change
Assert service method called with correct linkId
Assert track('vet_primary_set') called
[NEW] Test in PetForm.link.test.tsx
Add test: "switching primary from one vet to another updates both roles"
Mock service to return updated links
Verify old primary role changes to previous role
Verify new link becomes primary
Component 2: Service Integration
The service method petVetService.setPrimaryVet() already exists (lines 49-56 in petVetService.ts) and calls linkRepo.setPrimaryForPet() which handles:

Promoting selected link to primary
Demoting previous primary (preserving its prior role)
No service changes needed - just wire up UI.

Phase 4: Implement Slice 5 Search Polish (MEDIUM PRIORITY)
Goal: Enhanced search and optional pet counts per vet.

Component 1: Enhanced VetListPage Search
[MODIFY]
VetListPage.tsx
Update search filter to check:
vet.name.toLowerCase().includes(term)
vet.clinicName?.toLowerCase().includes(term) (if exists)
vet.specialties?.toLowerCase().includes(term) (if exists)
Add vet_search telemetry with anonymized term length
Fire on search input change (debounced to avoid spam)
[MODIFY]
VetListPage.test.tsx
Add test: "search filters by clinic name"
Add test: "search filters by specialties"
Add test: "fires vet_search telemetry with term length"
Component 2 (OPTIONAL): Linked Pet Counts
This is marked optional in the original plan. Can defer to future work.

If implementing:

[NEW] Method in
PetVetRepository.ts
Add
listLinksByVet(vetId: string): Promise<PetVetLink[]>
Query links where link.vetId === vetId
[MODIFY] VetListPage or VetCard
Lazy-load count on expand or hover
Display badge with count
Add i18n key veterinarians:list.linkedPetsCount
Recommendation: Skip this for MVP, add in future iteration.

Phase 5: Implement Slice 6 Hardening (LOW PRIORITY)
Goal: Production polish, edge cases, and documentation.

Component 1: Analytics Verification
[NEW]
analytics.integration.test.ts
Integration tests verifying all vet-related events fire:
vet_created
vet_updated
vet_archived (if implemented)
vet_link_created
vet_link_deleted
vet_primary_set
vet_search
Mock analytics backend
Execute user flows
Assert events logged correctly
Component 2: Edge Case Handling
[MODIFY]
vetService.ts
Add whitespace trimming for name, phone, email
Add validation for empty strings after trim
Test idempotent operations (duplicate create, double link)
[NEW] Edge case tests in vetService.test.ts
Test: trimmed name/phone used for duplicate detection
Test: creating duplicate with extra whitespace still fails
Test: linking same vet twice is idempotent (no error)
Component 3: Documentation
[NEW]
ADR-030-vet-uniqueness-lock.md
Document the uniqueness-lock approach
Explain ownerUserId + '|' + \_normName + '|' + \_e164Phone key
Describe why lock docs retained on archive
[MODIFY]
README.md
Add section on veterinarians feature
Document feature flags
Link to ADR
Component 4: i18n Audit
[AUDIT] All vet-related files
Search for hardcoded strings
Verify all user-facing text uses
t()
calls
Check all i18n keys exist in locale files
Verify Spanish translations exist
Component 5: Final Tests
[MODIFY] Various test files
Add error branch coverage:
Duplicate on update (not just create)
Network failures during link operations
Permission errors gracefully handled
Test link idempotency
Test role preservation on primary demotion
Verification Plan
Phase 1 Verification
Run npm run lint - no errors
Run npm run build - successful
Run npm test src/features/veterinarians - all pass
No console warnings about MUI Grid
Phase 2 Verification
Enable both feature flags in dev
Create pet with linked vet
Verify vet chip shows on PetCard
Verify vet link shows on PetDetailsPage
Click vet link → nav to vet edit page
Run npm test src/features/pets - all pass
Phase 3 Verification
Open pet with 2+ linked vets
Change role dropdown to 'primary' on second vet
Verify first vet role changes (not primary anymore)
Verify only one primary exists
Check browser console for vet_primary_set event
Run all pet and vet tests - all pass
Phase 4 Verification
Open VetListPage
Search for vet by clinic name - works
Search for vet by specialty - works
Check telemetry events fired
Run vet tests - all pass
Phase 5 Verification
Full test suite passes
Lint/build clean
Documentation reviewed
Manual QA of all flows
Spanish locale displays correctly
Breaking Changes / Migration
No breaking changes. All new features are gated by existing feature flags:

vetsEnabled - already controls vet routes
vetLinkingEnabled - already controls pet-vet linking UI
Users won't see changes unless flags are enabled.

Testing Strategy
Each phase includes:

Unit tests for modified components
Integration tests for user flows
Feature flag toggle tests (on/off states)
Regression tests for existing functionality
Test patterns established:

Use @test-utils for rendering
Mock services with
installVetServiceMock
Mock router with
mockRouter
Mock analytics for telemetry tests
Rollout Plan
Recommended order:

Phase 1 (cleanup) - low risk, unblocks quality
Phase 2 (pet UI) - high value, users can see vet links
Phase 3 (role mgmt) - high value, core feature complete
Phase 4 (search) - nice-to-have polish
Phase 5 (hardening) - final quality pass
Can deploy phases 1-3 together, defer 4-5 to future release if needed.

Open Questions
Role Dropdown UX: Chips with menu vs. List view with inline dropdowns?

Recommendation: List view for better role management UX
Pet Counts: Implement in Phase 4 or defer to future?

Recommendation: Defer - adds complexity, unclear value
Archive Feature: Original plan mentions vet_archived - not implemented yet

Should we add archive/restore functionality?
Recommendation: Add if needed, or mark vets as "inactive" flag
Telemetry Backend: Are analytics events actually being sent to a backend?

Current implementation is no-op imports
Need integration with real analytics service?
Success Criteria
Must Have (Phases 1-3):

✅ All existing tests pass
✅ Pet cards show vet chips with Name — Role
✅ Pet details shows linked vets with nav links
✅ Users can set/change primary vet via dropdown
✅ Only one primary per pet enforced
✅ Telemetry events fire correctly
✅ No MUI deprecation warnings
✅ Build and lint clean
Nice to Have (Phases 4-5):

✅ Enhanced search works across multiple fields
✅ All edge cases handled gracefully
✅ Documentation complete
✅ Full i18n coverage verified
Overall:

Feature matches original plan specification
User flows tested end-to-end
Code quality maintains project standards
No regressions in existing pet features
