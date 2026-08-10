# STUDIO-SKILLS.md — skills in Grade: what they are, where they live, how a model gets them

Source of truth for how Grade handles **skills**: reusable units of agent capability that a project can turn on, upload, or create, and that reach whatever model the composer is talking to. This is a new system area; today it does not exist. This doc describes the shape to build toward, starting from the smallest honest version.

Companion to [`STUDIO-SHADERS.md`](./STUDIO-SHADERS.md) (the shader pipeline is the first skill), [`STUDIO-CHAT.md`](./STUDIO-CHAT.md) (the composer is the first consumer), [`STUDIO-LEARNING.md`](./STUDIO-LEARNING.md) (the three deployment modes), and [`STUDIO-BYODS.md`](./STUDIO-BYODS.md) (the sandbox origin that code-bearing skills need).

## Governing rule: a skill is the enforced path, not a suggestion

Wherever Grade generates or checks something, and a skill (or a pipeline of skills) covers that work, it is used. Always. This is not left to the model's discretion, and not left to the user remembering to ask for it. The code that does the work routes through the skill, so using it is the only road, not a choice.

Stated as a rule: if a skill exists for X, then X is produced or checked through that skill, full stop. The model decides only *what* it wants (a glassy blue shader, an accessible form). The skill owns *how* it is made and proven correct. Because the validation step lives inside that route, nothing that fails the skill's checks can escape, anywhere, whether or not anyone invoked it by name.

For open-ended work that is not pre-wired, a routing check at the moment of generation ("does a skill apply to what I am about to make?") sends it down the skill's road when one applies. Everything below (the registry, the surfaces, the modes) is in service of this rule.

Enforcement means the skill is the only *path* for that work, not that every check runs on every edit. Generation runs its skill inline, every time. Checks run on a cadence and surface their freshness, so they are never bypassed but also never overwhelming. See "When skills run" below.

## One guidance substrate: skills and component rules are the same thing

Skills are not a harness feature. They are the design system's knowledge made executable, and so are component contracts, reference layouts, and rules. A component contract says how to use a part. A skill or pipeline says how to make or check a capability. A reference layout says what good looks like. A rule says what never to do. Different granularity, one substance: guidance.

So there is **one guidance substrate**, the design system's own knowledge, and every generation reads from it whatever surface triggered it. The composer reads it, the MCP path reads it, a BYO model reads it. The thing that loads it in front of the model (the "harness") differs per surface; the substrate does not. This is already true for the component half: the playbook that feeds the system prompt carries the allowlist, sidecars, contracts, and reference layouts into every Studio generation. Skills are the same kind of entry one level up, sitting in the same corpus.

"Built into generation" means **always supplied**, not baked into model weights. Weights would be fine-tuning, which Studio deliberately avoids (see `STUDIO-LEARNING.md`). Always-supplied is the better kind of built in: the model stays general, the guidance is effectively intrinsic because it is attached to every generation, and unlike weights you can edit it, version it, toggle it per project, and watch it improve.

Practical consequence: contracts, skills and pipelines, reference layouts, and rules are managed as one corpus, loaded by one substrate that generation never runs without. Adding a skill, tightening a contract, or pinning a reference layout are the same act, teaching the design system, and they reach the model the same way.

## Skills, pipelines, and composition

A skill is an **atom** of capability. A **pipeline** is how atoms are orchestrated into an enforced route. Some capabilities are a single skill; others are a pipeline that composes several, and the governing rule operates on the route, not the atom.

Take an accessibility check. It is not one thing. It is contrast, alt text, focus order, ARIA roles, motion safety, target sizes. Each of those is a self-contained skill with its own findings (a severity-scored list). The accessibility check is the **pipeline** that runs them as a dependency graph (independent skills in parallel, dependent ones waiting) and aggregates their findings into one verdict. This is the rubric-and-aggregator pattern Grade already uses for the layout-quality review suite: a shared result shape across review skills, a severity-driven verdict, and an orchestrator with DAG ordering and a budget.

So "accessibility goes through the accessibility pipeline" is the enforced path; whether that pipeline is one skill or seven is an implementation detail behind it. The same will be true of generation: "a shader goes through the shader skill" may in time become "a shader goes through the shader pipeline" once it grows separate produce and validate steps.

Two shapes of pipeline, both enforced the same way:

- **Produce** pipelines make something and validate it before returning. The shader skill: generate, compile-gate, contract-lint, or fall back.
- **Check** pipelines inspect something and return findings. The accessibility pipeline: run the review skills, aggregate, verdict.

A skill can appear in more than one pipeline (a contrast skill serves the accessibility check and could serve a theme-quality check), which is the payoff of keeping skills as small single-purpose atoms.

## When skills run: produce inline, checks on a cadence

Produce and check pipelines run at different times, and conflating them is how a system gets overloaded.

**Produce runs inline, every time.** Making something routes through its skill at the moment of generation, synchronously, always. "Add a FAQ section" goes through the front-end section skill exactly as a shader goes through the shader skill: generate, validate, return. There is no version of it that skips the skill, because generation happens once and you want it right the first time. This is the governing rule at full strength, and it is affordable because producing one thing is a single bounded operation.

**Checks run on a cadence, never on every edit.** A check pipeline (accessibility, layout quality, theme quality) is advisory and expensive, and running it after every keystroke would drown both the work and the person. So a check is triggered, not constant:

- on request, a "run accessibility" control the person clicks when they want it, the way a designer runs a tool in their design system rather than having it scream continuously;
- automatically after a large pass or a milestone (a big generation, a publish), not after small edits;
- never silently on every change.

**Freshness instead of constant running.** Each check records when it last ran and against which revision, so the UI shows staleness against the current state: "Accessibility: run 8 edits ago", or "passed, current". That reading is the activity trail (`STUDIO-AUDIT.md`) plus the revision spine: last-run revision compared to the current revision gives edits-since, which is the staleness. The person re-runs when they care, and always knows how stale the last result is. The check is still enforced (the only way to perform an accessibility pass is through the accessibility pipeline), but *when* it runs is a cadence the person and the milestones drive, not a tax on every edit.

The split in one line: you cannot *make* a thing without its produce skill, and you cannot *check* a thing except through its check pipeline, but produce is inline-always while check is on-request-or-milestone with visible freshness.

## What a skill is (today: just a file)

A skill is a **markdown file**. A `SKILL.md` with a little frontmatter (a `name` and a one-line `description`) and an instruction body. That is the whole thing for now. Later a skill may also bundle code (scripts the agent can run) and resources, but the v1 unit in Grade is text: a description the model sees up front, and a body it reads when the skill is relevant.

```markdown
---
name: shader-pipeline
description: Author or generate a Grade shader (base or layer) plus its parameter contract, validated so it never returns a broken shader.
---

<the instructions: how to write the GLSL body, the contract shape,
 the compile-and-lint gate, where to register it.>
```

That is it. A skill is not an API object and not a protocol message. It is content.

## The one mechanic to understand: the harness provides skills as context

Neither the model API nor MCP has a native "skill". Skills are loaded **as context by the harness**, the loop that builds the request around the model. The model only ever sees text in its system and message turns.

In Grade, the composer's harness is **your own `/api/chat` route**. The model is not calling you; you are calling the model, and you assemble the system prompt and the tool set first. So skills reach the model the same way everything else does: your route puts them in the request.

Two steps, both additions to the request the route already builds:

1. **Stitch descriptions in.** Add each enabled skill's `name` plus `description` to the stitched system prompt (alongside the existing `STUDIO.md` system-prompt stitching). Always present, cheap, one line each. This is how the model knows a skill exists.
2. **Load on demand (progressive disclosure).** When the model signals it wants a skill, the route reads that `SKILL.md` body and appends it to the next turn. The full instructions are only ever in context when needed. For skills that *do* something (run code, return a validated artifact), the route instead registers a **skill-backed tool** in the same tool array it already passes to the AI SDK, and the model calls it.

Because the route owns the prompt and tools for every model, **skills are model-agnostic by construction**. An instruction-only skill is just text any model can follow. A tool-skill needs only that the model supports tool calling, which the composer already relies on. Adding a skill changes nothing model-specific.

## The registry (the small piece of real infrastructure)

The only durable infrastructure is a **skills registry**: the list of available skills and, per project, which are on plus any uploaded or created ones.

- **Built-in skills** ship with Grade (the first is the shader pipeline). Files in the repo, e.g. a `skills/` area or a `@gradeui/skills` package.
- **Per-project config** records which built-ins are enabled and holds uploaded or in-product-created skills. Stored per project in the database and RLS-scoped exactly like themes and assets (mirror `project_access`). Toggling a skill is toggling what the harness loads, nothing protocol-level.

```ts
interface ProjectSkillConfig {
  enabled: string[];              // built-in skill ids turned on for this project
  custom: Array<{                 // uploaded or created in-product
    id: string;
    name: string;
    description: string;          // shown to the model up front
    body: string;                 // the SKILL.md instructions
    kind: "instruction" | "code"; // code skills are gated, see below
  }>;
}
```

The same registry feeds every surface. The composer reads it to stitch; an MCP server reads it to decide which tools to expose; a BYOT export reads it to package a plugin.

**Two levels: Grade defaults plus per-project overrides.** There is a Grade-wide default set, the skills on for every project unless a project says otherwise, and each project layers its own enable, disable, and additions on top. A new project inherits the Grade defaults; turning a skill off in a project overrides the default for that project only. Resolution at load time is: Grade defaults, then the project's overrides, then the project's own uploaded or created skills.

**The management UI.** A settings surface to: browse available skills (built-in plus the project's own), toggle each on or off for the project, add a skill (upload an instruction-only `SKILL.md`, or create one in product), and, for Grade admins, edit the global defaults every project inherits. Same mindset as a designer turning tools on and off in their design system: the set is visible, owned, and changeable, not hidden plumbing.

## The three surfaces (one registry, three entry points)

1. **Studio composer (first, and smallest to build).** The `/api/chat` route stitches enabled skill descriptions and loads bodies or wires tools on demand. Works for any composer model.
2. **MCP tool (expose the capability, not the file).** For an external agent, you do not ship the skill text. You run the skill **server-side inside your own harness** (authenticated through Sign in with Claude) and expose a thin tool, for example `generate_shader`. The caller invokes the tool and gets the validated result; it never receives the `SKILL.md`. The skill stays the implementation, the tool is the interface. This is the clean path and fits the existing gradeui MCP.
3. **BYOT / send to another model (ship the file).** If another model should actually *run* the skill, it needs the `SKILL.md` in its context. If it runs on a skills-aware harness (Claude Code, the Agent SDK, Cowork) you distribute the files, usually as a plugin bundle. If it is a raw model, you paste the instructions into its system prompt; it is only text. MCP's separate `prompts` capability can also serve a skill as a fetchable prompt, but that leaks the instructions and relies on the client honoring them, so prefer surface 2 unless the goal is genuinely to hand over the skill.

Rule of thumb: over MCP you almost never send the skill as context. You wrap it as a tool and run it yourself. A skill only becomes "context for another model" when you deliberately give them the file.

## Instruction-only versus code skills (the safety line)

- **Instruction-only** skills are pure prompt text. Safe to load anywhere, including into a BYO model, the moment they are enabled. The v1 of every Grade skill is this.
- **Code-bearing** skills carry scripts the agent runs. Running uploaded code requires the **sandbox origin** that BYODS and the canvas already need (`STUDIO-BYODS.md`, `STUDIO-CANVAS.md`); same-origin execution is not a boundary. So "upload a skill" distinguishes the two: instruction-only is available immediately, code-bearing is gated behind the sandbox and is a later phase.

## The shader skill as the first entry

The shader authoring-and-validation pipeline (`STUDIO-SHADERS.md`, `STUDIO-SHADERS-PRD.md`) is the first skill in the registry. It demonstrates all three surfaces: an instruction body the composer can load, a server-side capability the MCP tool wraps (generate-and-validate, returning GLSL plus contract already through the compile-and-lint gate), and a candidate for a Studio "new shader" action. Its gate lives inside the skill, never the caller, so no surface can return a broken shader.

## Phased rollout

- **K0 (smallest honest version)**: skills are `.md` files in a `skills/` area; a registry lists them; the `/api/chat` route stitches enabled descriptions and loads bodies on demand. Instruction-only. The shader skill is the first entry. No upload, no MCP yet.
- **K1**: per-project `ProjectSkillConfig` in the database, RLS-scoped; Grade-wide defaults plus per-project overrides; the management UI to browse and toggle skills per project, and (for admins) edit the global defaults.
- **K2**: skill-backed tools (the dispatch path) so a skill can return a validated artifact, not just instructions; the shader pipeline becomes a tool.
- **K3**: MCP exposure of skill-backed capabilities as tools for external agents.
- **K4**: upload and in-product creation of instruction-only skills, stored per project.
- **K5**: code-bearing skills behind the sandbox origin; BYOT plugin export.

## File map (proposed)

- `skills/<id>/SKILL.md`: a built-in skill (description plus instructions). Start here.
- a skills registry module (built-in list plus the per-project config loader).
- `apps/docs/app/api/chat/route.ts`: the stitch-and-dispatch step (the composer harness).
- database: a `project_skills` row or a field on the project, RLS-scoped like `assets` and theme variants.

## See also

- `STUDIO-SHADERS.md` and `STUDIO-SHADERS-PRD.md`: the first skill and its validation gate.
- `STUDIO-CHAT.md`: the composer and its tool-call protocol, the first consumer.
- `STUDIO-LEARNING.md`: the three deployment modes (in-app, BYOT, MCP) the registry feeds.
- `STUDIO-BYODS.md` / `STUDIO-CANVAS.md`: the sandbox origin code-bearing skills depend on.
