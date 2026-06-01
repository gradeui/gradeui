"use client";

/**
 * AssetBrowser — the user's own files (media / fonts / documents) in the
 * left panel. CRUD over `StudioStorage.listAssets/uploadAsset/deleteAsset`,
 * which back onto the private `user-assets` bucket (migration 0014).
 *
 * Assets are USER-owned (reusable across projects), so this lists the
 * whole library, tabbed by type. Bytes are delivered via short-lived
 * signed URLs minted on list. Cloud-only — in local mode the list is
 * empty and upload surfaces a clear "sign in" error.
 *
 * v1 scope: list, upload (drag/drop + picker), delete. Wiring an asset
 * into a screen slot (the MediaSurface `src` patch) is the next slice —
 * see STUDIO-STORAGE.md S1.
 */

import * as React from "react";
import {
  Upload,
  Trash2,
  Image as ImageIcon,
  Type,
  FileText,
  Loader2,
} from "lucide-react";
import { getStudioStorage } from "@/lib/studio-storage";
import type { Asset, AssetType } from "@/lib/studio-storage";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const TYPE_TABS: { id: AssetType; label: string; icon: typeof ImageIcon; accept: string }[] = [
  { id: "media", label: "Media", icon: ImageIcon, accept: "image/*,video/*" },
  { id: "font", label: "Fonts", icon: Type, accept: ".woff,.woff2,.ttf,.otf" },
  {
    id: "document",
    label: "Docs",
    icon: FileText,
    accept: ".pdf,.doc,.docx,.txt,.md",
  },
];

/** Read an image file's natural dimensions before upload (best-effort). */
/** Supabase errors are plain objects ({ message, details, hint, code }),
 *  not Error instances — String() on them yields "[object Object]". Pull
 *  out something human-readable. */
function errMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (e && typeof e === "object") {
    const o = e as { message?: unknown; details?: unknown; hint?: unknown };
    const parts = [o.message, o.details, o.hint]
      .filter((p): p is string => typeof p === "string" && p.length > 0);
    if (parts.length) return parts.join(" — ");
    try {
      return JSON.stringify(e);
    } catch {
      return String(e);
    }
  }
  return String(e);
}

function readImageSize(
  file: File,
): Promise<{ width?: number; height?: number }> {
  if (!file.type.startsWith("image/")) return Promise.resolve({});
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      resolve({});
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}

export function AssetBrowser() {
  const [type, setType] = React.useState<AssetType>("media");
  const [assets, setAssets] = React.useState<Asset[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [dragOver, setDragOver] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const load = React.useCallback(async (t: AssetType) => {
    setLoading(true);
    try {
      const list = await getStudioStorage().listAssets({ type: t });
      setAssets(list);
    } catch (err) {
      // Local mode returns [] rather than throwing; a real error here is
      // worth surfacing (e.g. the 0014 migration hasn't run).
      toast.error("Couldn't load assets", {
        description: errMessage(err),
      });
      setAssets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load(type);
  }, [type, load]);

  const uploadFiles = React.useCallback(
    async (files: FileList | File[]) => {
      const arr = Array.from(files);
      if (arr.length === 0) return;
      setUploading(true);
      try {
        for (const file of arr) {
          const { width, height } = await readImageSize(file);
          await getStudioStorage().uploadAsset({ file, type, width, height });
        }
        await load(type);
        // Trail entry — the page logs via grade:image-action (it has the
        // active project + screen context the browser doesn't).
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("grade:image-action", {
              detail: {
                action: "asset.upload",
                name:
                  arr.length === 1 ? arr[0].name : `${arr.length} files`,
              },
            }),
          );
        }
        toast.success(arr.length === 1 ? "Uploaded" : `Uploaded ${arr.length}`);
      } catch (err) {
        toast.error("Upload failed", {
          description: errMessage(err),
        });
      } finally {
        setUploading(false);
      }
    },
    [type, load],
  );

  const handleDelete = React.useCallback(
    async (asset: Asset) => {
      // Optimistic — drop it immediately, restore on failure.
      setAssets((prev) => prev.filter((a) => a.id !== asset.id));
      try {
        await getStudioStorage().deleteAsset(asset.id);
      } catch (err) {
        toast.error("Couldn't delete", {
          description: errMessage(err),
        });
        load(type);
      }
    },
    [type, load],
  );

  const activeTab = TYPE_TABS.find((t) => t.id === type) ?? TYPE_TABS[0];

  return (
    <div className="flex flex-col gap-2 px-3 py-2">
      {/* Section header + upload */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Assets
        </span>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          title={`Upload ${activeTab.label.toLowerCase()}`}
          aria-label="Upload"
          className="inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50 [&_svg]:size-3.5"
        >
          {uploading ? <Loader2 className="animate-spin" /> : <Upload />}
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={activeTab.accept}
          className="hidden"
          onChange={(e) => {
            if (e.target.files) uploadFiles(e.target.files);
            e.target.value = ""; // allow re-selecting the same file
          }}
        />
      </div>

      {/* Type tabs */}
      <div className="flex gap-1">
        {TYPE_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setType(t.id)}
            aria-pressed={type === t.id}
            className={cn(
              "inline-flex flex-1 items-center justify-center gap-1 rounded-md px-2 py-1 text-xs transition [&_svg]:size-3.5",
              type === t.id
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <t.icon />
            {t.label}
          </button>
        ))}
      </div>

      {/* Drop zone / grid */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files) uploadFiles(e.dataTransfer.files);
        }}
        className={cn(
          "min-h-24 rounded-md border border-dashed p-2 transition",
          dragOver ? "border-primary bg-primary/5" : "border-border",
        )}
      >
        {loading ? (
          <div className="flex items-center justify-center py-6 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        ) : assets.length === 0 ? (
          <p className="px-1 py-4 text-center text-xs text-muted-foreground">
            Drop {activeTab.label.toLowerCase()} here, or use the upload
            button.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {assets.map((a) => (
              <AssetTile key={a.id} asset={a} onDelete={() => handleDelete(a)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AssetTile({
  asset,
  onDelete,
}: {
  asset: Asset;
  onDelete: () => void;
}) {
  const isImage = asset.contentType.startsWith("image/");
  return (
    <div className="group relative aspect-square overflow-hidden rounded-md border border-border bg-muted/40">
      {isImage && asset.url ? (
        // object-contain (not cover) so the WHOLE asset shows — logos,
        // wide banners, and tall shots don't get center-cropped in the
        // library. The muted tile reads as the neutral backing.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={asset.url}
          alt={asset.name}
          className="h-full w-full object-contain p-1"
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1 p-1 text-center">
          {asset.type === "font" ? (
            <Type className="h-4 w-4 text-muted-foreground" />
          ) : (
            <FileText className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="line-clamp-2 text-[10px] leading-tight text-muted-foreground">
            {asset.name}
          </span>
        </div>
      )}
      <button
        type="button"
        onClick={onDelete}
        aria-label={`Delete ${asset.name}`}
        title="Delete"
        className="absolute right-1 top-1 inline-flex h-5 w-5 items-center justify-center rounded bg-background/80 text-muted-foreground opacity-0 shadow-sm backdrop-blur-sm transition hover:text-destructive group-hover:opacity-100 [&_svg]:size-3"
      >
        <Trash2 />
      </button>
    </div>
  );
}
