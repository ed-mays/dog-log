## GitHub Issue Organization Guidelines

To approximate Agile hierarchy (epic > feature > story) in GitHub Issues:

- **Labels**  
  Tag issues with labels such as `epic`, `feature`, or `story` to indicate their role in the hierarchy. Use additional labels for type (bug, enhancement), component (frontend, backend), and status (todo, in progress, review).

- **Milestones**  
  Group issues using milestones based on delivery goals (e.g., release, sprint). You can use milestones for broader time-based groupings and epics as labels, or designate major initiatives as milestones.

- **Issue Linking**  
  Create an "epic" issue and reference related "feature" or "story" issues within its description using task lists or markdown links:

  ```
  - [ ] #123 Add login functionality
  - [ ] #124 Build logout process
  ```

  This enables quick navigation and clear relationships between items.

- **Templates and Conventions**  
  Maintain consistent label naming conventions and consider issue templates for each hierarchy layer to ensure clarity and completeness.

- **Triaging and Assignment**  
  Regularly review unassigned issues, triage, and assign owners to encourage accountability and avoid backlog clutter.

For more advanced hierarchy and backlog management, consider using GitHub Projects Beta or tools like Zenhub for native epic/story relationships.
