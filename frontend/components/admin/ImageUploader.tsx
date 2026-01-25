"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { Upload, X, ImagePlus, Loader2 } from "lucide-react";
import { adminFetch } from "@/lib/api/admin-fetch";

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
  maxSizeMB?: number;
  maxVideoSizeMB?: number;
}

// Compress image using canvas
async function compressImage(
  file: File,
  maxSizeMB: number,
  maxWidth = 1920,
  maxHeight = 1920
): Promise<File> {
  // Only compress images that exceed the size limit
  if (file.size <= maxSizeMB * 1024 * 1024) {
    return file;
  }

  // Only compress supported image types
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const img = document.createElement("img");
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    img.onload = () => {
      URL.revokeObjectURL(img.src);

      // Calculate new dimensions while maintaining aspect ratio
      let { width, height } = img;
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      canvas.width = width;
      canvas.height = height;

      if (!ctx) {
        resolve(file);
        return;
      }

      // Draw image on canvas
      ctx.drawImage(img, 0, 0, width, height);

      // Try different quality levels to get under size limit
      const targetSize = maxSizeMB * 1024 * 1024;
      const outputType = file.type === "image/png" ? "image/png" : "image/jpeg";
      let quality = 0.9;
      let attempts = 0;
      const maxAttempts = 5;

      const tryCompress = () => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }

            // If still too large and we have attempts left, reduce quality
            if (blob.size > targetSize && attempts < maxAttempts) {
              attempts++;
              quality -= 0.15;
              if (quality > 0.1) {
                tryCompress();
                return;
              }
            }

            // Create new file with compressed data
            const compressedFile = new File([blob], file.name, {
              type: outputType,
              lastModified: Date.now(),
            });

            console.log(
              `Compressed ${file.name}: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`
            );

            resolve(compressedFile);
          },
          outputType,
          quality
        );
      };

      tryCompress();
    };

    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      resolve(file); // Return original on error
    };

    img.src = URL.createObjectURL(file);
  });
}

export function ImageUploader({
  images,
  onChange,
  maxImages = 5,
  maxSizeMB = 5,
  maxVideoSizeMB = 20,
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaAccept = "image/*,video/*";

  const isVideoUrl = (url: string) => {
    const clean = url.split("?")[0].toLowerCase();
    return [".mp4", ".webm", ".mov", ".m4v"].some((ext) => clean.endsWith(ext));
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const uploadFile = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await adminFetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      const data = await response.json();
      return data.url;
    } catch (err) {
      console.error("Upload error:", err);
      return null;
    }
  };

  const handleFiles = async (files: FileList | File[]) => {
    setError(null);
    const fileArray = Array.from(files);

    // Validate file count
    if (images.length + fileArray.length > maxImages) {
      setError(`Maximum ${maxImages} médias autorisés`);
      return;
    }

    // Validate file types
    const validFiles: File[] = [];
    for (const file of fileArray) {
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");
      if (!isImage && !isVideo) {
        setError("Seuls les images et vidéos sont autorisées");
        continue;
      }
      // Videos: check size limit (no compression)
      if (isVideo && file.size > maxVideoSizeMB * 1024 * 1024) {
        setError(`Vidéo trop volumineuse (max ${maxVideoSizeMB}MB)`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    // Compress images that exceed the size limit
    setCompressing(true);
    const processedFiles: File[] = [];
    for (const file of validFiles) {
      if (file.type.startsWith("image/")) {
        const compressed = await compressImage(file, maxSizeMB);
        // Check if compression was successful
        if (compressed.size > maxSizeMB * 1024 * 1024) {
          setError(`Image "${file.name}" trop volumineuse même après compression`);
          continue;
        }
        processedFiles.push(compressed);
      } else {
        processedFiles.push(file);
      }
    }
    setCompressing(false);

    if (processedFiles.length === 0) return;

    setUploading(true);

    try {
      const uploadPromises = processedFiles.map(uploadFile);
      const results = await Promise.all(uploadPromises);
      const successfulUrls = results.filter((url): url is string => url !== null);

      if (successfulUrls.length > 0) {
        onChange([...images, ...successfulUrls]);
      }

      if (successfulUrls.length < processedFiles.length) {
        setError("Certains fichiers n'ont pas pu être uploadés");
      }
    } catch (err) {
      setError("Échec de l'upload");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [images, maxImages]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleRemove = async (index: number) => {
    const imageUrl = images[index];
    const fileName = imageUrl.split("/").pop();
    const marker = "/storage/v1/object/public/";
    const markerIndex = imageUrl.indexOf(marker);

    // Try to delete from server (but don't block on failure)
    if (markerIndex !== -1) {
      const afterMarker = imageUrl.slice(markerIndex + marker.length);
      const [bucket, ...parts] = afterMarker.split("/");
      const path = parts.join("/");
      if (bucket && path) {
        const query = new URLSearchParams({ bucket, path });
        adminFetch(`/api/upload?${query.toString()}`, { method: "DELETE" }).catch(() => {});
      }
    } else if (fileName && imageUrl.startsWith("/uploads/")) {
      adminFetch(`/api/upload?file=${fileName}`, { method: "DELETE" }).catch(() => {});
    }

    onChange(images.filter((_, i) => i !== index));
  };

  const handleUrlAdd = (url: string) => {
    if (url && !images.includes(url)) {
      onChange([...images, url]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
          transition-colors duration-200
          ${isDragging
            ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
            : "border-[var(--color-border)] hover:border-[var(--color-primary)]/50"
          }
          ${images.length >= maxImages ? "opacity-50 pointer-events-none" : ""}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={mediaAccept}
          multiple
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading || compressing || images.length >= maxImages}
        />

        {compressing ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 text-[var(--color-primary)] animate-spin" />
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Compression en cours...
            </p>
          </div>
        ) : uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 text-[var(--color-primary)] animate-spin" />
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Upload en cours...
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="w-8 h-8 text-[var(--color-muted-foreground)]" />
            <p className="text-sm text-[var(--color-foreground)]">
              Glisser-déposer ou cliquer pour ajouter
            </p>
            <p className="text-xs text-[var(--color-muted-foreground)]">
              JPEG, PNG, WebP, GIF ({maxSizeMB}MB) · MP4, WebM, MOV ({maxVideoSizeMB}MB)
            </p>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-sm text-[var(--color-destructive)]">{error}</p>
      )}

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          <AnimatePresence>
            {images.map((image, index) => (
              <motion.div
                key={image}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="relative aspect-square rounded-xl overflow-hidden bg-[var(--color-muted)]/10 group"
              >
                {isVideoUrl(image) ? (
                  <video
                    src={image}
                    className="absolute inset-0 h-full w-full object-cover"
                    muted
                    playsInline
                    preload="metadata"
                  />
                ) : (
                  <Image
                    src={image}
                    alt={`Image ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                )}
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="absolute top-1 right-1 p-1 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
                {index === 0 && (
                  <span className="absolute bottom-1 left-1 px-2 py-0.5 text-xs bg-black/50 text-white rounded-full">
                    Principal
                  </span>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Add More Button */}
          {images.length < maxImages && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="aspect-square rounded-xl border-2 border-dashed border-[var(--color-border)] flex items-center justify-center hover:border-[var(--color-primary)]/50 transition-colors"
            >
              <ImagePlus className="w-6 h-6 text-[var(--color-muted-foreground)]" />
            </button>
          )}
        </div>
      )}

      {/* Image count */}
      <p className="text-xs text-[var(--color-muted-foreground)]">
        {images.length} / {maxImages} médias
      </p>
    </div>
  );
}
