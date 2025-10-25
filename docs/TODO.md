# DogLog TODOs by Category

## Overview

This file contains a backlog of desired changes to the DogLog project.

### Document Structure

- The `Ready for Dev` heading contains functional requirements ready for development.
- The `Unrefined` heading contains items that are committed but need refinement before they can be implemented.
- The `Backlog` heading contains the remainder of planned work.
- The `Goals` heading contains overall functional and nonfunctional goals of the product.

### Prefixes

- `Feature` specifies creating or enhancing an app feature
- `Goal` specifies a generalized goal for the application
- `Question` specifies an open question or decision to be made
- `Spike` specifies work to investigate concepts

---

## Ready for Dev

## Unrefined

### Feature: Navigation Bar

- Show navigation bar when user is logged in
- Create and integrate navigation bar component
  - Should not show for unauthenticated users
  - Should include logout component

### Feature: Pet Management

- Display Pet List as cards
- Create PetSummary component to display key details?
- Spike: Maybe it would be better to edit the pet inline in card?
- Filter pet list by name

## Backlog

### Feature: Track Vets by User

- User has a global, dynamic list of vets assignable to pets
- Use tag-like approach (e.g., Jira tags) with suggested/existing options
- Prototype this user tagging feature

### Feature: User Profile

Users should be able to edit basic information and upload a profile image

### Feature: Easter Egg

- Add a memorial page for Zuul, linked as an easter egg

### Feature: Tech Debt

- Continue implementing snapshot tests for UI components
  - Already implemented for WelcomePage, GoogleLoginButton, and LogoutButton components
  - Update GoogleLoginButton test ID to `google-login-button`

---

## General Goals

- Fully embrace and enforce i18n
  - Establish consistent i18n testing patterns
  - Investigate i18n workflow tools (e.g., lint plugins)?
  - Manage consistency between locales?
  - Refactor i18n JSON files/structure
- Improve visual styling
  - Investigate CSS frameworks (e.g., Tailwind, Material)
- Improve user experience
  - Clean up app URLs?
    - Is URL structure a security risk? What do best practices suggest?
    - Make the URL structure more shareable and readable
- Improve guidance docs (for multi-LLM workflows)
  - Ensure guidance is consistent across LLM tools
- Document architectural decisions
- Improve human docs (engineering/use documentation, config)
- Fully embrace and enforce a11y
- Keep unit test coverage above 90%
- Improve logging and diagnostics (Firebase abstraction layer)
- Illustrate best practices for React 19 app development

---

## Implementation/Process Improvements

-[x] Implement pre-commit hooks
-[x] Investigate Husky or similar tools for pre-commit rules
-[x] Enforce unit tests passing, clean lint, and clean build at commit

---

## Questions/Open Items

- Should PetSummary editing be inline in card?
- Are ugly/complex URLs a security risk?
- What are best practices for shareable/clean URLs?
- Investigate lint plugins for i18n workflow?
- Tools for managing locale consistency in i18n?
