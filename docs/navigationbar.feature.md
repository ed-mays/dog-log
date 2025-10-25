# User Story

As an application user
I want a navigation bar in the application
So that I can easily navigate to different areas of the application

# Technical Guidance

- The Navigation Bar should be based on the MUI AppBar component
- References:
  - Material UI AppBar Docs
  - Material UI Navbar Best Practices
  - React Router Integration with MUI

# Acceptance Criteria

_Note: I think these AC are more app-level than component level. NavBar should not have to know about auth state_

## Scenario: Navigation bar does not display for unauthenticated users

Given I am an unauthenticated user
When I view the application
Then I do not see a navigation bar

## Scenario: Navigation bar displays for authenticated users

Given I am an authenticated user
When I view the application
Then I see a navigation bar

## Scenario: Navigation Bar Visual Appearance

Given I am an authenticated user
When I see the navigation bar



