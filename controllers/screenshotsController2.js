import fs from "fs";
import path from "path";
import { ROOT_NOTES_DIR } from "../config/paths.js";
import {
  sanitizeFilename,
  normalizeTimestamp,
  ensureDirExists,
} from "../utils/fileUtils.js";
import { parseVTT, vttTimeToSeconds } from "../utils/vttUtils.js";

export function saveScreenshot(req, res) {
  try {
    let { parentTitle, title, timestamp, screenshot, captions } = req.body;

    console.log(
      JSON.stringify({
        parentTitle,
        title,
        timestamp,
        screenshot: screenshot.slice(0, 20),
        captions,
      })
    );
    if (!parentTitle || !title || !timestamp || !screenshot) {
      return res
        .status(400)
        .json({ error: "Missing title/timestamp/screenshot/parentTitle" });
    }

    timestamp = normalizeTimestamp(timestamp);
    const cleanParent = sanitizeFilename(parentTitle.toLowerCase());
    const cleanTitle = sanitizeFilename(title.toLowerCase());
    const cleanTime = sanitizeFilename(timestamp);

    const parentDir = path.join(ROOT_NOTES_DIR, cleanParent);
    const titleDir = path.join(parentDir, cleanTitle);
    ensureDirExists(parentDir);
    ensureDirExists(titleDir);

    const imageFile = `${cleanTime}_${
      Math.floor(Math.random() * 900) + 100
    }.jpeg`;
    const imagePath = path.join(titleDir, imageFile);
    const notesFile = path.join(titleDir, `${cleanTitle}.md`);

    // Save screenshot
    const base64Data = screenshot.replace(/^data:image\/jpeg;base64,/, "");
    fs.writeFileSync(imagePath, Buffer.from(base64Data, "base64"));

    // Ensure notes.md exists
    if (!fs.existsSync(notesFile))
      fs.writeFileSync(notesFile, `# ${title}\n\n`);

    // Read notes content
    let notesContent = fs.readFileSync(notesFile, "utf-8");

    // New md entry (single-line)
    const newEntry = `Timestamp:${timestamp}![Screenshot](/${cleanTitle}/${imageFile})`;

    // Function to insert screenshot after caption in list
    function insertWithCaptions(captionText) {
      if (!captionText) return notesContent + `\n[${newEntry}]\n`;

      const lines = notesContent.split("\n");
      const captionLineNum = lines.findIndex((line) =>
        line.includes(captionText)
      );

      if (captionLineNum === -1) {
        // Caption not found → append caption + screenshot
        return notesContent + `\n${captionText}\n[${newEntry}]\n`;
      }

      // Look for existing list in next line
      let nextLine = lines[captionLineNum + 1] || "";
      if (nextLine.startsWith("[")) {
        // Parse existing entries inside [ ... ]
        let existingEntries = nextLine
          .slice(1, -1) // remove brackets
          .split(", ")
          .map((e) => e.trim());

        // Add new entry
        existingEntries.push(newEntry);

        // Sort by timestamp
        existingEntries.sort((a, b) => {
          const tA = a.match(/Timestamp:(\d{2}:\d{2})/)[1];
          const tB = b.match(/Timestamp:(\d{2}:\d{2})/)[1];
          const [mA, sA] = tA.split(":").map(Number);
          const [mB, sB] = tB.split(":").map(Number);
          return mA * 60 + sA - (mB * 60 + sB);
        });

        // Update the line
        lines[captionLineNum + 1] = `[${existingEntries.join(", ")}]`;
      } else {
        // Insert new list in next line
        lines.splice(captionLineNum + 1, 0, `[${newEntry}]`);
      }

      return lines.join("\n");
    }

    // Insert screenshot depending on captions or VTT
    if (captions?.trim()) {
      notesContent = insertWithCaptions(captions.trim());
    } else {
      const vttFile = path.join(titleDir, `${cleanTitle}.vtt`);
      if (fs.existsSync(vttFile)) {
        const blocks = parseVTT(fs.readFileSync(vttFile, "utf-8"));
        const screenshotTime = vttTimeToSeconds(
          timestamp.includes(":") && timestamp.split(":").length === 2
            ? "00:" + timestamp + ".000"
            : timestamp.includes(".")
            ? timestamp
            : timestamp + ".000"
        );

        let matchedCaption = null;
        for (const b of blocks) {
          if (screenshotTime >= b.start) matchedCaption = b.text;
          else break;
        }

        notesContent = insertWithCaptions(matchedCaption);
      } else {
        // No captions or VTT → just append
        notesContent += `\n[${newEntry}]\n`;
      }
    }

    fs.writeFileSync(notesFile, notesContent, "utf-8");
    res.json({ success: true, saved: imageFile, notes: notesFile });
  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({ error: "Failed to save screenshot" });
  }
}
