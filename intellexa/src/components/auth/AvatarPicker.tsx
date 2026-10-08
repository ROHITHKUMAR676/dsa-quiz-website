import { useEffect, useState } from "react";
import { Camera, UserRound } from "../pixel/PixelLucide";
import { resolveApiAsset } from "../../lib/api";

interface AvatarPickerProps {
  value?: string | null;
  onSelect: (file: File) => Promise<void> | void;
  onError?: (message: string) => void;
  label?: string;
  size?: "setup" | "profile" | "signup";
  shape?: "circle" | "square";
  disabled?: boolean;
}

async function prepareAvatar(source: File): Promise<File> {
  if (!source.type.startsWith("image/")) throw new Error("Choose an image file.");
  if (source.size > 10 * 1024 * 1024) throw new Error("Choose an image smaller than 10 MB.");

  const bitmap = await createImageBitmap(source);
  if (bitmap.width > 8000 || bitmap.height > 8000 || bitmap.width * bitmap.height > 40_000_000) {
    bitmap.close();
    throw new Error("Choose an image with dimensions below 8,000 by 8,000 pixels.");
  }
  const edge = 512;
  const canvas = document.createElement("canvas");
  canvas.width = edge;
  canvas.height = edge;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("This browser could not prepare the image.");

  const scale = Math.max(edge / bitmap.width, edge / bitmap.height);
  const width = bitmap.width * scale;
  const height = bitmap.height * scale;
  context.drawImage(bitmap, (edge - width) / 2, (edge - height) / 2, width, height);
  bitmap.close();

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => result ? resolve(result) : reject(new Error("This browser could not prepare the image.")), "image/webp", 0.84);
  });
  if (blob.type !== "image/webp") throw new Error("This browser cannot prepare WebP images. Try a recent browser version.");
  if (blob.size > 512 * 1024) throw new Error("This image could not be compressed enough. Choose another photo.");
  return new File([blob], "profile-avatar.webp", { type: "image/webp" });
}

export default function AvatarPicker({
  value,
  onSelect,
  onError,
  label = "Upload profile photo",
  size = "profile",
  shape = "circle",
  disabled = false,
}: AvatarPickerProps) {
  const resolvedValue = resolveApiAsset(value);
  const [preview, setPreview] = useState<string | null>(resolvedValue);
  const [preparing, setPreparing] = useState(false);
  const [error, setError] = useState("");
  const shapeClass = shape === "circle" ? "rounded-full" : "rounded-2xl";
  const sizeClass = size === "signup" ? "h-24 w-24" : size === "setup" ? "h-20 w-20" : "h-24 w-24";

  useEffect(() => {
    setPreview(resolvedValue);
  }, [resolvedValue]);

  useEffect(() => () => {
    if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
  }, [preview]);

  const selectImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!selected) return;
    setPreparing(true);
    setError("");
    try {
      const file = await prepareAvatar(selected);
      setPreview(URL.createObjectURL(file));
      await onSelect(file);
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "Could not upload this image.";
      setPreview(resolvedValue);
      setError(message);
      onError?.(message);
    } finally {
      setPreparing(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`relative ${sizeClass}`}>
        <div className={`h-full w-full overflow-hidden border-2 border-surface-border bg-surface-light ${shapeClass}`}>
          {preview ? (
            <img src={preview} alt="Profile photo preview" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-ink-faint">
              <UserRound className="h-1/2 w-1/2" aria-hidden="true" />
            </div>
          )}
        </div>
        <label
          title={label}
          className={`absolute -bottom-1 -right-1 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-2 border-void-100 bg-neon-blue text-void shadow-md transition-colors hover:bg-neon-blue2 ${disabled || preparing ? "pointer-events-none opacity-60" : ""}`}
        >
          <Camera className="h-4 w-4" aria-hidden="true" />
          <input
            type="file"
            accept="image/*"
            aria-label={label}
            className="sr-only"
            disabled={disabled || preparing}
            onChange={(event) => void selectImage(event)}
          />
        </label>
      </div>
      <p className="min-h-4 text-center text-xs text-ink-faint" role="status">
        {preparing ? "Saving photo..." : error || label}
      </p>
    </div>
  );
}
