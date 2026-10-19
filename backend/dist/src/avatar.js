"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadAvatar = exports.MAX_AVATAR_BYTES = void 0;
exports.uploadErrorMessage = uploadErrorMessage;
exports.readUploadedAvatar = readUploadedAvatar;
exports.storeAvatar = storeAvatar;
exports.removeStoredAvatar = removeStoredAvatar;
const node_crypto_1 = require("node:crypto");
const promises_1 = require("node:fs/promises");
const node_path_1 = __importDefault(require("node:path"));
const multer_1 = __importDefault(require("multer"));
const sharp_1 = __importDefault(require("sharp"));
const env_1 = require("./env");
const http_1 = require("./http");
/** Largest accepted upload. Matches the schema's comment. */
exports.MAX_AVATAR_BYTES = 5 * 1024 * 1024;
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
const AVATAR_DIR = node_path_1.default.resolve(env_1.env.uploadDir, "avatars");
/**
 * Reads exactly one file from the `avatar` field of a multipart body.
 *
 * Multer's own limits are applied too, so a client that ignores the schema
 * still cannot drive the process to the ground: `fields: 1` bounds the part
 * count and `files: 1` bounds the file count, which are the knobs the recent
 * advisories turn on.
 */
exports.uploadAvatar = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: exports.MAX_AVATAR_BYTES, files: 1, fields: 1 },
}).single("avatar");
/** Multer's own errors, mapped to the same envelope the rest of the API uses. */
function uploadErrorMessage(error) {
    const code = error?.code;
    if (code === "LIMIT_FILE_SIZE") {
        return "That image is too large. Pick one under 5 MB.";
    }
    if (code === "LIMIT_UNEXPECTED_FILE") {
        return "Send exactly one image in the avatar field.";
    }
    return "That image could not be uploaded.";
}
/** The file the request actually carried, validated before anything is decoded. */
async function readUploadedAvatar(file) {
    if (file === undefined || !Buffer.isBuffer(file.buffer) || file.buffer.byteLength === 0) {
        throw http_1.fail.validation("Choose an image to upload.", { avatar: "Choose an image to upload." });
    }
    if (!ACCEPTED_MIME.has(file.mime)) {
        throw http_1.fail.validation("Use a JPEG, PNG or WebP image.", { avatar: "Use a JPEG, PNG or WebP image." });
    }
    // Decoding early catches a file that lies about its type: the MIME header is
    // what the browser claims, sharp is what the bytes actually are. This rejects
    // a renamed .exe before any of it reaches the disk.
    const image = (0, sharp_1.default)(file.buffer, { failOn: "error", limitInputPixels: 40_000_000 });
    const metadata = await image.metadata();
    if (metadata.format === undefined || metadata.width === undefined || metadata.height === undefined) {
        throw http_1.fail.validation("That image could not be read.", { avatar: "That image could not be read." });
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
async function storeAvatar(userId, buffer) {
    const name = `${userId}-${(0, node_crypto_1.randomBytes)(8).toString("hex")}.webp`;
    const absolute = node_path_1.default.join(AVATAR_DIR, name);
    await (0, promises_1.mkdir)(AVATAR_DIR, { recursive: true });
    await (0, promises_1.writeFile)(absolute, await (0, sharp_1.default)(buffer, { limitInputPixels: 40_000_000 })
        .rotate()
        .resize(OUTPUT_SIZE, OUTPUT_SIZE, { fit: "cover", position: "centre" })
        .webp({ quality: OUTPUT_QUALITY })
        .toBuffer());
    return `${node_path_1.default.posix.join("/uploads/avatars", name)}`;
}
/**
 * Deletes a file this process wrote, if it still exists.
 *
 * Best-effort on purpose: a failed cleanup must never turn a successful upload
 * into an error the user sees. The caller awaits it, so a stray file is a log
 * line rather than a half-updated avatar.
 */
async function removeStoredAvatar(url) {
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
        await (0, promises_1.unlink)(node_path_1.default.resolve(env_1.env.uploadDir, relative));
    }
    catch (error) {
        const code = error?.code;
        if (code !== "ENOENT") {
            console.warn("[bloodlink] avatar cleanup failed:", error);
        }
    }
}
