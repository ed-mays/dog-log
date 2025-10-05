# Plan for Refactoring `WelcomePage`

This document outlines the step-by-step plan to extract the inline `WelcomePage` into its own dedicated component. The goal is to improve code structure, adhere to project conventions, and eliminate code duplication.

## The Plan

Here is the step-by-step breakdown of the changes to be made:

1.  **Create the New Component File**:
  -   A new file will be created at `/src/features/authentication/WelcomePage.tsx`.
  -   This file will contain the `WelcomePage` component, which will render the welcome message and the `LoginButton`. It will use the `useTranslation` hook for its text content.

2.  **Create a Scoped Stylesheet**:
  -   In accordance with project guidelines to colocate styles, a new CSS module will be created at `/src/features/authentication/WelcomePage.module.css`.
  -   The `.welcome-container` styles from the global `/src/App.css` file will be moved into this new module to ensure the styles are scoped directly to the `WelcomePage` component.

3.  **Refactor `AppRoutes.tsx`**:
  -   The inline `WelcomePage` function definition will be removed.
  -   The newly created `WelcomePage` component will be imported and used in the route definition for `/welcome`.

4.  **Refactor `App.tsx` to Remove Duplication**:
  -   The `App.tsx` component currently has a hardcoded, duplicate version of the welcome screen.
  -   This inline JSX will be removed and replaced with a render of our new, reusable `<WelcomePage />` component. This is a key step for making the code more DRY (Don't Repeat Yourself).

5.  **Clean Up Global Styles**:
  -   The now-redundant `.welcome-container` style will be removed from `/src/App.css` since it has been moved to its own CSS module.

6.  **Add a Unit Test**:
  -   To ensure the new component is robust and to follow testing guidelines, a new test file will be created: `/src/features/authentication/WelcomePage.test.tsx`.
  -   This test will verify that the component renders the correct title, message, and the login button.

## Outcome

This plan will result in a cleaner, more maintainable, and better-structured application that aligns perfectly with the project's architectural goals and conventions.
