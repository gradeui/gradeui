import { VideoPlayer } from "@/components/ui/video-player";
import { ComponentPreview } from "@/components/component-preview";
import { PropsTable } from "@/components/props-table";

const videoPlayerProps = [
  { name: "src", type: "string", default: "-", description: "Video source URL." },
  { name: "controls", type: "boolean", default: "true", description: "Show native playback controls. Set false for chromeless background video." },
  { name: "autoPlay", type: "boolean", default: "false", description: "Autoplay on mount. Respects reduced-motion." },
  { name: "loop", type: "boolean", default: "false", description: "Loop at end of video." },
  { name: "muted", type: "boolean", default: "autoPlay", description: "Mute audio. Required true if autoPlay (browser restriction)." },
  { name: "pauseOffscreen", type: "boolean", default: "true", description: "Pause when the surface leaves the viewport." },
  { name: "aspect", type: '"video" | "square" | "portrait" | "wide" | "auto"', default: '"video"', description: "Aspect ratio of the surface." },
  { name: "radius", type: '"none" | "sm" | "md" | "lg" | "xl"', default: '"lg"', description: "Corner radius — driven by `--rds-media-radius` CSS var." },
  { name: "objectFit", type: '"cover" | "contain" | "fill"', default: '"cover"', description: "How the video sits inside the surface." },
  { name: "poster", type: "string", default: "-", description: "Poster image shown before playback." },
  { name: "playbackRate", type: "number", default: "1", description: "Playback speed." },
];

const DEMO_SRC = "/sample.mp4";
const DEMO_POSTER = "/movie-poster.jpg";

export default function VideoPlayerPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight">Video Player</h1>
        <p className="text-lg text-muted-foreground mt-2">
          Native HTML5 video wrapped in the shared media surface. Controls-on
          for a standard player, controls-off for a chromeless viewer.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">Installation</h2>
        <div className="rounded-lg bg-muted border p-4 font-mono text-sm overflow-x-auto">
          <pre><code>{`import { VideoPlayer } from "@gradeui/ui"`}</code></pre>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">Player mode</h2>
        <ComponentPreview code={`<VideoPlayer src="/sample.mp4" poster="/movie-poster.jpg" controls />`}>
          <VideoPlayer src={DEMO_SRC} poster={DEMO_POSTER} controls aspect="video" radius="lg" />
        </ComponentPreview>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">Viewer mode (chromeless)</h2>
        <p className="text-sm text-muted-foreground">
          No controls, autoplay, muted, loops — the pattern for hero / background video.
        </p>
        <ComponentPreview code={`<VideoPlayer src="/sample.mp4" controls={false} autoPlay loop muted />`}>
          <VideoPlayer
            src={DEMO_SRC}
            controls={false}
            autoPlay
            loop
            muted
            aspect="wide"
            radius="lg"
          />
        </ComponentPreview>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">Props</h2>
        <PropsTable props={videoPlayerProps} />
      </div>
    </div>
  );
}
