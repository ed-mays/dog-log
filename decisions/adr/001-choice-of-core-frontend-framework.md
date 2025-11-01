TITLE: Use React as the Core Frontend Framework

STATUS: Accepted
DATE: 2025-10-31

CONTEXT:
The project requires a modern, component-based UI framework to build a dynamic and interactive single-page application.
The choice of framework is a foundational decision that influences the entire development lifecycle, including
ecosystem, hiring, and long-term maintenance.

DECISION:
We will use React (specifically version 19 or later) as the primary UI library. All UI will be constructed as a tree of
React components.

CONSEQUENCES:

- **Positive**:
  - Large and active ecosystem with a vast number of libraries and tools.
  - Strong community support and extensive documentation.
  - Component-based architecture promotes reusability and modularity.
  - Large talent pool of developers familiar with the framework.
- **Negative**:
  - React is a library, not a full framework, requiring other libraries for routing, state management, etc., leading to
    more decision-making and integration work.
  - The rapid evolution of React and its ecosystem requires continuous learning.

ALTERNATIVES CONSIDERED:

- **Vue.js**: A progressive framework that is also component-based. While excellent, its ecosystem is smaller than
  React's.
- **Angular**: A full-fledged, opinionated framework. It can be more complex than necessary for the scale of this
  project and has a steeper learning curve.
- **Svelte**: A compiler-based approach that offers high performance. It is a newer technology with a smaller community
  and ecosystem compared to React.

AUTHOR: Gemini

RELATED:

- All component files (`.tsx`)
