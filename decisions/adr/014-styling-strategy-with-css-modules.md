TITLE: Use CSS Modules for Component Styling

STATUS: Accepted
DATE: 2025-10-31

CONTEXT:
The project needs a styling strategy that prevents class name collisions and encapsulates styles to individual
components, ensuring that a component's styles do not unintentionally affect other parts of the application.

DECISION:
We will use CSS Modules as the primary styling strategy. Styles for a component will be defined in a
`Component.module.css` file and co-located with the component. Class names will be imported as an object in the
component file and applied to elements, which guarantees that all class names are locally scoped by default.

CONSEQUENCES:

- **Positive**:
  - Automatic local scoping of class names eliminates the risk of global CSS conflicts.
  - Encourages a modular and component-centric approach to styling.
  - Vite provides excellent out-of-the-box support for CSS Modules.
  - The resulting CSS is highly readable and maintainable as it's co-located with the component it styles.
- **Negative**:
  - Sharing styles between components can be more verbose than with traditional CSS or utility-class frameworks.
  - Dynamic styling based on props can be less ergonomic than with CSS-in-JS solutions.

ALTERNATIVES CONSIDERED:

- **CSS-in-JS (e.g., Styled Components, Emotion)**: Provides powerful dynamic styling capabilities but can introduce a
  runtime performance overhead and adds another library dependency.
- **Utility-First CSS (e.g., Tailwind CSS)**: Excellent for rapid prototyping but can lead to cluttered HTML with many
  utility classes and may not be as expressive for complex, custom component designs.
- **Plain CSS/Sass with BEM naming**: A manual convention for avoiding style conflicts. It is effective but relies
  entirely on developer discipline, whereas CSS Modules enforces scoping automatically.

AUTHOR: Gemini

RELATED:

- `src/styles/`
