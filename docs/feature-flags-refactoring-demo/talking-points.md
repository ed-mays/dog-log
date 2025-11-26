# Talking points for the presentation

## Context

The purpose of this demo is to share my experience using the Google Antigravity IDE to refactor a feature flag system in my personal React project. I am in the process of learning full-stack development and am using this project as a way to learn and experiment with different technologies and tools. As part of that learning, I am also exploring and comparing different LLM tools as they evolve. The list of coding assistants I have explored so far includes:

- GitHub Copilot
- Gemini Code Assist
- JetBrains Junie
- Google Antigravity

I also routinely use Perplexity for general tasks, but more along the lines of research and finding/summarizing documentation during the development process. I also use it to double-check the lower-quality assistants (looking at you, Gemini Code Assist) when I think they're going off track or proposing a terrible solution.

## What is it?

Google Antigravity is an IDE based on Visual Studio Code, but with an agentic coding assistant that leverages the new Gemini 3 model.

## Use cases I have tried

- Feature-level refactoring, e.g. "Analyze the veterinarians feature and refactor it to use feature flags instead of environment variables"
- Code quality analysis, e.g. "help me find opportunities to improve the structure of this component"
- Improving testability, e.g. "help me refactor this component to make it more easily testable"
- Rapid prototyping, e.g. "I want to implement a way for users to link a specific pet to a specific vet. Requirements are defined in [some markdown file]
- Coming to technical decisions, e.g. "I want to implement the react store pattern. Give me a comparison between the available approaches so I can select the best one for this project"
- Documenting technical decisions, e.g. "I decided to use Zustand as my store, now create an ADR for this decision
- Troubleshooting build issues, e.g. "Run `pnpm run build` and fix any errors"
- Learning about backend technologies, e.g. "I use firebase for my backend. Help me understand the Firebase Remote Config feature and how I can leverage that to improve the flexibility of my feature flag subsystem"
- Same thing, but as I was learning Github actions, e.g. "I want to implement a CI/CD pipeline for my project using Github actions. Can you help me understand how to set it up?"

## Stuff I like

- You can tell the agent to create a plan for a given implementation. If the agent is configured to ask permission (be careful, that's not actually the default option), it has a great feature where you can open the plan and comment on it (just like a PR) before telling the agent to proceed. I have found this very useful for getting feedback on the agent's plan and providing guidance before it goes and refactors the entire application into Angular out of spite.
- I have to say that Gemini 3 does provide substantially higher-quality output overall than most other models (the next closest one is JetBrains Junie).
- Although the token budget is pretty small (and there is no way to top up credits), I do like their approach of resetting the quota every 5 hours. I have found that it makes me think more carefully about what I'm asking for and how I'm specifying my requests. It also makes it less painful if the agent goes into a loop and burns its entire quota trying to implement a "hello world" test or whatever - at least you can just wait 5 hours and try again instead of waiting for a monthly quota reset (looking at you here, Junie).
- It was pleasantly surprising to learn that the agent is actually pretty good with things I might consider out of scope for a coding assistant, for example my experience learning about Github actions. In that case, it took me roughly an hour to go from zero to:
  - Actions pipeline configured for PR and merge to main
  - Firebase hosting sites for preview and staging environments
  - Quality gates on lint, coverage, and build
  - Automatic deployment to staged environments upon PR creation and merge to main

## Stuff I don't like

- Agentic mode burns through tokens like a volcano through a marshmallow - I'm afraid of what this tool will cost once it leaves free public preview. The default Gemini 3 Pro (high) variant burns through them even faster. When using that model, I usually get 30-45 minutes of coding before the quota is exhausted.
- The code completion feature is ridiculously optimistic, often suggesting large blocks of code where the first 25% is what you want and the rest is crap you will have to delete afterwards.
- The "use your judgement before proceeding" option is also overly optimistic, occasionally coming up with a detailed (but wrong) plan that could be fixed with a few comments, but instead the agent self-assesses its plan as correct and begins implementation.
- Despite the fact that it "has deep context from analyzing your entire codebase", it still hasn't figured out that this is a test-driven project so I routinely have to instruct it to write tests after it makes any changes.
- Still needs a lot of management and hand-holding to keep it on track
  - Code routinely ignores presets including lint rules, test coverage, etc.
    - I have learned that after letting the agent do anything, I need to run the following commands:
      - `pnpm run lint` and tell the agent to fix the lint errors
      - `pnpm run test:coverage` and tell the agent to fix the test coverage to meet defined thresholds
      - `pnpm run build` and tell the agent to fix any build errors
      - ...regular git commit/push flow
- There is no visual indicator of remaining quota, which leads to issues where the quota runs out while the agent is in the middle of a task. Aside from the annoyance of waiting until the quota resets, I have found that Google Antigravity is also really bad at picking up where it left off once the quota resets.

## Much confidence. Such wrong. Wow hallucination.

- While I was editing this exact document, Google Antigravity IDE actually hallucinated its own URL as `https://antigravity.dev/` instead of the correct URL
- Same thing, but also hallucinated the entire "What is it?" section of this document, claiming that it is a plugin for VS Code and other IDEs - it's not, it's a standalone IDE
- Same thing, but it also decided to hallucinate pricing details for the model, which is currently only available as a free public preview - there are no paid options at this time.
- When asked to to fix tests that it broke during an implementation, Gemini Code Assist chose to delete the failing tests as its first solution. When challenged, its next step was to reinstate the tests but mark them as skipped so they would not execute. **The reason for the tests failing was due to a misspelled import in the affected test file, so no tests actually had to be changed.**

<img src="agentic-ai-hallucinations.png" alt="Description of image" width="200" height="200">

## General observations on LLMs in software development

- They have only a superficial understanding of testing, and I have found no model yet that actually understands test-driven development. (as in even the "create an adding calculator using TDD" kata). This in particular makes me sad.
- They need very consistent handholding and very, very clear instructions. I have come to think of them as being like an intern who is just learning how to code and has a lot of outdated references (Again, looking at you, Gemini Code Assist)
- It makes sense to take a defensive stance when using agentic LLMs, for example:
  - Always create a clean branch before letting the agent do anything so you can revert easily
  - Frequent commits are your friend
  - Always keep quality in mind - lint, tests, build, etc. and always double-check those after each step the agent takes
- I have found the spec-driven flow to be useful not only for guiding agents (when they create a plan based on the spec) but also because it encourages me to ideate more completely while I'm defining the spec/requirements
- I have found that if I carefully and critically review the agent's plan and comment on the artifact to provide guidance, I tend to get much better results in general
- I have found pretty much across the board that many LLMs burn a lot of output tokens by being overly verbose. I tend to instruct the LLM to be as terse as possible unless I need the extra detail for clarification.
- I haven't been brave enough to try the multi-agent mode yet, maybe I'll do that tonight.

## References

### Google Antigravity

[Google Antigravity IDE](https://antigravity.google/download)

### Example App

[Dog Log GitHub Repo](https://github.com/ed-mays/dog-log)

- Note: The branch for this project is `antigravity-demo`

---

# Obligatory Unit Testing Note

The last time we saw this project was in the presentation 4 weeks ago. At the time, there were 135 tests in all, including several flaky ones...

While implementing the new Veterinarians feature, I was able to increase that to 398 tests overall by carefully coaching the LLMs and insisting upon a test-forward focus throughout their implementation.

The point here is that this can actually be achieved, but it requires constant, focused management and forcing the LLM to go back and focus on tests.
