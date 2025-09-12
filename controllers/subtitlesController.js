import fs from "fs";
import path from "path";
import { ROOT_NOTES_DIR } from "../config/paths.js";
import { sanitizeFilename, ensureDirExists } from "../utils/fileUtils.js";

export function saveSubtitles(req, res) {
  try {
    const { url, content, title, parentTitle, videoLength } = req.body;

    if (!url || !content || !title || !parentTitle) {
      return res
        .status(400)
        .json({ error: "Missing url/content/title/parentTitle" });
    }

    // Safe names
    const cleanParent = sanitizeFilename(parentTitle.toLowerCase());
    const cleanTitle = sanitizeFilename(title.toLowerCase());

    // Folder structure
    const parentDir = path.join(ROOT_NOTES_DIR, cleanParent);
    const titleDir = path.join(parentDir, cleanTitle);
    const structuredNotes = path.join(parentDir, "structured-notes");

    ensureDirExists(parentDir);
    ensureDirExists(titleDir);
    ensureDirExists(structuredNotes);

    // File paths
    const vttFile = path.join(titleDir, `${cleanTitle}.vtt`);
    const notesFile = path.join(titleDir, `${cleanTitle}.md`);
    const notesFileStructured = path.join(structuredNotes, `${cleanTitle}.md`);

    // Save raw VTT
    fs.writeFileSync(vttFile, content, "utf-8");

    // Process VTT → plain text
    const cleanLines = content
      .split("\n")
      .map((line) => line.trim())
      .filter(
        (line) =>
          line &&
          !/^\d+$/.test(line) &&
          !/-->/i.test(line) &&
          !line.startsWith("WEBVTT") &&
          !line.startsWith("NOTE")
      );

    const finalText = cleanLines.join(" ").replace(/\s+/g, " ");

    if (!fs.existsSync(notesFile)) {
      fs.writeFileSync(notesFile, `# ${title} - ${videoLength}\n\n`);
    }

    // Prevent duplicate subtitles
    const notesContent = fs.readFileSync(notesFile, "utf-8");
    if (notesContent.includes("### Subtitles Extracted")) {
      return res.json({
        success: false,
        message: "Subtitles already exist",
        notes: notesFile,
      });
    }

    // Extra files
    fs.writeFileSync(
      path.join(titleDir, `per-notes.md`),
      `# ${title}\n\n ${finalText}`
    );
    if (!fs.existsSync(notesFileStructured)) {
      fs.writeFileSync(notesFileStructured, "");
    }

    // Append subtitles
    const mdEntry = `\n${videoLength}\n\n### Subtitles Extracted\n${finalText}\n`;
    fs.appendFileSync(notesFile, mdEntry);

    res.json({ success: true, saved: { vtt: vttFile, notes: notesFile } });
  } catch (err) {
    console.error("❌ Error saving subtitles:", err);
    res.status(500).json({ error: "Failed to save subtitles" });
  }
}
