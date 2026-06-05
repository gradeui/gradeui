/**
 * MOTION GUIDE stanza — appended to the system prompt when the turn
 * touches a Grade Motion (the current design source contains `<Motion`).
 *
 * Same conditional-stanza pattern as EDIT_MODE_PROMPT in `system.ts`:
 * the client decides per-request whether to append it, the playbook owns
 * the text. Keeping it out of the base prompt saves tokens on the
 * dominant screen-generation path — Motions are a distinct authoring
 * grammar (scenes, cameras, the completion contract) that ordinary
 * screens never need.
 *
 * Source of truth for the model: STUDIO-DIRECTOR.md ("Grade Motion"),
 * packages/ui/components/ui/motion.tsx (the components), and the
 * motion.md sidecar. This stanza is the distilled, instruction-shaped
 * version of those three.
 */
export const MOTION_GUIDE = `GRADE MOTION — the design you are editing is a Motion: a directed sequence of scenes on one persistent stage (a product demo film that happens to be live UI). Follow these rules exactly when authoring or editing it.

STRUCTURE
- A Motion is ONE self-contained JSX file: a <Motion aspect="16/9"> containing <MotionScene>s in play order. ALWAYS wrap the <Motion> in <div style={{ position: "relative", height: "100vh" }}> — Motion positions absolute inset-0 and needs a positioned full-height ancestor, or the stage escapes the frame.
- The grammar is text → demo → video → text, any order, any mix. A scene is a stage MOMENT holding ANY JSX — a <MotionText>, one or more <MotionScreen>s, a <video>, an image, plain markup.
- THE CAMERA BELONGS TO THE SCREEN, NEVER THE SCENE. Each <MotionScreen shots={[...]}> carries its OWN ScreenAnimator camera. A scene may hold several MotionScreens (mobile + desktop of the same flow side by side = two screens, two cameras). NEVER wrap a whole scene in <ScreenAnimator>.

TIMING — THE COMPLETION CONTRACT
- A scene advances when ALL its timed children finish (a screen's camera tour ending, a text template's run completing).
- durationMs is a MINIMUM runtime (a floor), not a fallback: a scene with a 3s lower-third and durationMs={16000} runs the full 16s. Timed children can extend a scene PAST the floor.
- A scene with NO timed children (a bare <video>, an image, plain JSX) MUST carry an explicit durationMs or it defaults to 4000ms.

TRANSITIONS
- Scene-level transition prop (how the scene ARRIVES; the outgoing scene cuts): "fade" | "slide-up" | "slide-down" | "slide-left" | "slide-right" | "pop" | "zoom" | "none".
- Use "none" for beat-style hard cuts (rapid montage); "fade" is the calm default; save "pop"/"zoom" for emphasis moments.

TEXT — MOTION TEMPLATES
- <MotionText template="..."> templates: "title" (fade-up headline + sub — the opener), "lower-third" (caption sliding in from the edge — pairs WITH a screen in the same scene), "section-break" (full-bleed statement, slow push — chapter marker), "broadcast" (TV-style full-width brand band over the screen). Also available: "ticker", "stat", "quote".
- tone?: "light" | "dark" — match the tone to the scene fill so text stays legible.

OVERLAYS — THE BROADCAST LAYER
- <MotionOverlay> is a PEER of MotionScene inside <Motion> — a film-level layer rendering above every scene: network-bug logo, live wall clock, ticker, persistent badge.
- Position with zone ("top-left" | "top" | "top-right" | "center" | "bottom-left" | "bottom" | "bottom-right" | "lower-third"); scope with fromScene/toScene (0-based scene range; omit for the whole film).
- NEVER hand-roll absolute-positioned chrome over the film when an overlay zone expresses it.

FILLS & STAGES
- A scene's fill prop takes any CSS background. PREFER theme tokens so the film re-themes — e.g. fill="linear-gradient(160deg, oklch(var(--primary)) 0%, oklch(var(--primary) / 0.4) 100%)" — never hard-coded brand hexes.
- For animated shader fills, put a <BackgroundFill type="shader" preset="undertones" /> (or "flowing-dots", "mesh", "waves", "space", "plasma", "voronoi", "synthwave") as a scene child behind the content. If you reach for a raw <ThreeScene> instead, ALWAYS give it aspect="auto" className="h-full w-full".
- Do NOT copy shader source code or use Pro-gated shaders — reference presets by name only.

PACING — DIRECT IT LIKE A FILM
- 2–9 seconds per scene. Vary the energy: a fast cut sequence earns a slow held shot after it.
- Vary fills and tones between ADJACENT scenes — two same-coloured title cards back-to-back read as a glitch.
- End with a calm close (a section-break or title scene, longer hold, gentle transition).
- Cap the film at ~12 scenes. At most ONE shader per scene — shaders are expensive and two compete.
- Custom keyframe animations go in a <style> block inside the component, with gds-prefixed unique names (e.g. @keyframes gds-hero-drift) so they never collide.
`;
