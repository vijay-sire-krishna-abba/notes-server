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
    let { parentTitle, title, timestamp, screenshot, captions, rootDirectory } =
      req.body;

    console.log(
      JSON.stringify({
        parentTitle,
        title,
        timestamp,
        screenshot: screenshot.slice(0, 20),
        captions,
        rootDirectory,
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

    // Insert into notes
    let notesContent = fs.readFileSync(notesFile, "utf-8");
    const mdEntry = `\n\n![Screenshot](/${cleanTitle}/${imageFile})\n\n\n\n`;

    // appending to screenshots folder files
    const screenshotsFolder = path.join(parentDir, "screenshots-notes");
    const screenshotsFile = path.join(screenshotsFolder, `${cleanTitle}.md`);
    if (fs.existsSync(screenshotsFile)) {
      const screenshotMdEntry = `Timestamp: ${timestamp}\n![Screenshot](/${cleanTitle}/${imageFile})\n\n\n\n`;
      // Append cleanTitle to the file, with newline
      fs.appendFile(screenshotsFile, screenshotMdEntry + "\n", (err) => {
        if (err) {
          console.error("Error appending to file:", err);
        } else {
          console.log(`Appended to ${screenshotsFile}:`, screenshotMdEntry);
        }
      });
      //
    }

    if (captions?.trim()) {
      const idx = notesContent.indexOf(captions);
      notesContent =
        idx !== -1
          ? notesContent.slice(0, idx) +
            "\n" +
            mdEntry +
            captions +
            "\n" +
            notesContent.slice(idx + captions.length).trim()
          : notesContent + `\n${captions}\n${mdEntry}\n`;
    } else {
      // Try VTT timestamp alignment
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

        if (matchedCaption) {
          const idx = notesContent.indexOf(matchedCaption);
          notesContent =
            idx !== -1
              ? notesContent.slice(0, idx) +
                "\n" +
                mdEntry +
                matchedCaption +
                "\n" +
                notesContent.slice(idx + matchedCaption.length).trim()
              : notesContent + `\n${matchedCaption}\n${mdEntry}\n`;
        } else {
          notesContent += `\n${mdEntry}\n`;
        }
      } else {
        notesContent += `\n${mdEntry}\n`;
      }
    }

    fs.writeFileSync(notesFile, notesContent, "utf-8");
    res.json({ success: true, saved: imageFile, notes: notesFile });
  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({ error: "Failed to save screenshot" });
  }
}
