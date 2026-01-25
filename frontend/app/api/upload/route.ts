import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/guard";
import { createServerClient } from "@/lib/supabase/client";
import crypto from "crypto";

const MB = 1024 * 1024;
// Max file sizes
const MAX_IMAGE_SIZE = 5 * MB;
const MAX_VIDEO_SIZE = 20 * MB;
const MAX_FILE_SIZE = Math.max(MAX_IMAGE_SIZE, MAX_VIDEO_SIZE);

// Allowed media types
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];
const DEFAULT_BUCKET = "product-media";
const STORAGE_PREFIX = "products";
const SUPABASE_PUBLIC_MARKER = "/storage/v1/object/public/";

const getBucketName = (bucket?: string | null) =>
  (bucket || process.env.SUPABASE_STORAGE_BUCKET || DEFAULT_BUCKET).trim();

const getFileExtension = (mime: string) => {
  const ext = mime.split("/")[1] || "bin";
  if (ext === "jpeg") return "jpg";
  if (ext === "quicktime") return "mov";
  return ext;
};

const ensureBucket = async (bucketName: string) => {
  const supabase = createServerClient();
  const { data, error } = await supabase.storage.getBucket(bucketName);
  if (!error && data) {
    const allowed = data.allowed_mime_types;
    if (Array.isArray(allowed) && allowed.length > 0) {
      const missing = ALLOWED_TYPES.filter((type) => !allowed.includes(type));
      if (missing.length > 0) {
        const { error: updateError } = await supabase.storage.updateBucket(bucketName, {
          public: data.public,
          allowedMimeTypes: Array.from(new Set([...allowed, ...ALLOWED_TYPES])),
          fileSizeLimit: `${MAX_FILE_SIZE}`,
        });
        if (updateError) {
          console.error("Supabase bucket update error:", updateError);
        }
      }
    }
    return;
  }

  const { error: createError } = await supabase.storage.createBucket(bucketName, {
    public: true,
    fileSizeLimit: `${MAX_FILE_SIZE}`,
    allowedMimeTypes: ALLOWED_TYPES,
  });
  if (createError) {
    console.error("Supabase bucket create error:", createError);
    throw createError;
  }
};

// POST /api/upload - Upload image file
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: JPEG, PNG, WebP, GIF, MP4, WebM, MOV" },
        { status: 400 }
      );
    }

    const isVideo = file.type.startsWith("video/");
    const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;

    // Validate file size
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${Math.round(maxSize / MB)}MB` },
        { status: 400 }
      );
    }

    const bucketName = getBucketName();
    await ensureBucket(bucketName);

    // Generate unique filename
    const ext = getFileExtension(file.type);
    const uniqueId = crypto.randomUUID();
    const timestamp = Date.now();
    const fileName = `${timestamp}-${uniqueId}.${ext}`;
    const filePath = `${STORAGE_PREFIX}/${fileName}`;

    // Upload to Supabase Storage
    const bytes = await file.arrayBuffer();
    const buffer = new Uint8Array(bytes);
    const supabase = createServerClient();
    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload file" },
        { status: 500 }
      );
    }

    const { data: publicData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);
    const url = publicData.publicUrl;

    return NextResponse.json({
      url,
      path: filePath,
      bucket: bucketName,
      size: file.size,
      type: file.type,
    }, { status: 201 });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}

// DELETE /api/upload - Delete an uploaded file
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get("file");
    const filePath = searchParams.get("path");
    const bucketParam = searchParams.get("bucket");

    if (!fileName && !filePath) {
      return NextResponse.json({ error: "No file specified" }, { status: 400 });
    }

    if (filePath && filePath.includes("..")) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    const bucketName = getBucketName(bucketParam);
    const supabase = createServerClient();
    if (filePath) {
      const { error: deleteError } = await supabase.storage
        .from(bucketName)
        .remove([filePath]);
      if (deleteError) {
        console.error("Supabase delete error:", deleteError);
        return NextResponse.json({ error: "Failed to delete file" }, { status: 500 });
      }
    } else if (fileName) {
      // Legacy local uploads: allow cleanup by path if present in URL
      const markerIndex = fileName.indexOf(SUPABASE_PUBLIC_MARKER);
      if (markerIndex !== -1) {
        const afterMarker = fileName.slice(markerIndex + SUPABASE_PUBLIC_MARKER.length);
        const [bucket, ...parts] = afterMarker.split("/");
        const derivedPath = parts.join("/");
        if (bucket && derivedPath) {
          const { error: deleteError } = await supabase.storage
            .from(bucket)
            .remove([derivedPath]);
          if (deleteError) {
            console.error("Supabase delete error:", deleteError);
            return NextResponse.json({ error: "Failed to delete file" }, { status: 500 });
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete upload error:", error);
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
}
