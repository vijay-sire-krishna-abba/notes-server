import fs from "fs";
import path from "path";

// Sanitize filenames for safety
export function sanitizeFilename(str) {
  return str.replace(/[^a-z0-9\-_]/gi, "_");
}

// Ensure directory exists
export function ensureDirExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function normalizeTimestamp(timestamp) {
  const parts = timestamp.split(":"); // split by :

  // Ensure first part (hours) is 2 digits
  if (parts[0].length === 1) {
    parts[0] = "0" + parts[0];
  }

  return parts.join(":");
}