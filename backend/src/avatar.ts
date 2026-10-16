/**
 * Avatar uploads.
 *
 * A profile picture arrives as a multipart body, is normalised by sharp, and is
 * written to disk under `uploads/avatars/`. Three things are deliberate here.
 *
 * Memory storage, not disk. Multer's disk storage writes the whole request
 * somewhere before anything validates it, which means an oversized or
 * wrong-typed upload briefly exists on the machine only to be deleted. Holding
 * the buffer lets this reject it before it touches a filesystem.
 *
 * The file is renamed per upload. Browsers and image loaders cache hard, and
 * `avatarUrl` is the same path for every upload a user ever makes, so a new
 * picture would never appear for anyone who had already loaded the old one.
 *
 * EXIF is dropped. A phone photo carries a location, sometimes a device serial,
 * and that does not belong in a file anybody who can load an avatar can read.
 */

import { randomBytes } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import multer from "multer";
import sharp from "sharp";

import { env } from "./env";
import { fail } from "./http";

/** Largest accepted upload. Matches the schema's comment. */
export const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

/** The only real format an avatar may arrive in. */
const ACCEPTED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

/** Square, small enough for a header avatar and a pass card at the same time. */
const OUTPUT_SIZE = 512;

/** WebP at this quality is well under 60 kB at 512px, which is the point. */
const OUTPUT_QUALITY = 82;

/**
 * The directory avatars are written to.
 *
 * Resolved once at import so a route never has to think about it, and created
 * on first upload rather than at boot — a deploy that never receives an avatar
 * should not create an empty directory.
 */
const AVATAR_DIR = path.resolve(env.uploadDir, "avatars");

/** One upload, as a buffer with its claimed MIME type. */
export type UploadedAvatar = {
  buffer: Buffer;
  mime: string;
  originalName: string;
};

/**
 * Reads exactly one file from the `avatar` field of a multipart body.
 *
 * Multer's own limits are applied too, so a client that ignores the schema
 * still cannot drive the process to the ground: `fields: 1` bounds the part
 * count and `files: 1` bounds the file count, which are the knobs the recent
 * advisories turn on.
 */
export const uploadAvatar = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_AVATAR_BYTES, files: 1, fields: 1 },
}).single("avatar");

/** Multer's own errors, mapped to the same envelope the rest of the API uses. */
export function uploadErrorMessage(error: unknown): string {
  const code = (error as { code?: unknown } | null)?.code;

  if (code === "LIMIT_FILE_SIZE") {
    return "That image is too large. Pick one under 5 MB.";
  }

  if (code === "LIMIT_UNEXPECTED_FILE") {
    return "Send exactly one image in the avatar field.";
  }

  return "That image could not be uploaded.";
}

/** The file the request actually carried, validated before anything is decoded. */
export async function readUploadedAvatar(file: UploadedAvatar | undefined): Promise<Buffer> {
  if (file === undefined || !Buffer.isBuffer(file.buffer) || file.buffer.byteLength === 0) {
    throw fail.validation("Choose an image to upload.", { avatar: "Choose an image to upload." });
  }

  if (!ACCEPTED_MIME.has(file.mime)) {
    throw fail.validation("Use a JPEG, PNG or WebP image.", { avatar: "Use a JPEG, PNG or WebP image." });
  }

  // Decoding early catches a file that lies about its type: the MIME header is
  // what the browser claims, sharp is what the bytes actually are. This rejects
  // a renamed .exe before any of it reaches the disk.
  const image = sharp(file.buffer, { failOn: "error", limitInputPixels: 40_000_000 });

  const metadata = await image.metadata();

  if (metadata.format === undefined || metadata.width === undefined || metadata.height === undefined) {
    throw fail.validation("That image could not be read.", { avatar: "That image could not be read." });
  }

  return file.buffer;
}

/**
 * Writes the normalised avatar and returns its public path.
 *
 * `cover` crops to a square from the centre rather than squashing, so a portrait
 * becomes a portrait-shaped crop rather than a distorted face. The extension is
 * always `.webp` because that is what sharp produces, whatever arrived.
 */
export async function storeAvatar(userId: string, buffer: Buffer): Promise<string> {
  const name = `${userId}-${randomBytes(8).toString("hex")}.webp`;
  const absolute = path.join(AVATAR_DIR, name);

  await mkdir(AVATAR_DIR, { recursive: true });

  await writeFile(
    absolute,
    await sharp(buffer, { limitInputPixels: 40_000_000 })
      .rotate()
      .resize(OUTPUT_SIZE, OUTPUT_SIZE, { fit: "cover", position: "centre" })
      .webp({ quality: OUTPUT_QUALITY })
      .toBuffer(),
  );

  return `${path.posix.join("/uploads/avatars", name)}`;
}

/**
 * Deletes a file this process wrote, if it still exists.
 *
 * Best-effort on purpose: a failed cleanup must never turn a successful upload
 * into an error the user sees. The caller awaits it, so a stray file is a log
 * line rather than a half-updated avatar.
 */
export async function removeStoredAvatar(url: string | null): Promise<void> {
  if (url === null || url === "") {
    return;
  }

  // Only ever relative to the upload root. A stored value that escapes it —
  // `../../etc/passwd` — is a bug somewhere else, and silently deleting an
  // arbitrary path would be the wrong way to find out.
  const relative = url.startsWith("/uploads/") ? url.slice("/uploads/".length) : null;

  if (relative === null) {
    return;
  }

  try {
    await unlink(path.resolve(env.uploadDir, relative));
  } catch (error) {
    const code = (error as { code?: unknown } | null)?.code;

    if (code !== "ENOENT") {
      console.warn("[bloodlink] avatar cleanup failed:", error);
    }
  }
}
