export function parseVTT(vttContent) {
  const blocks = [];
  const lines = vttContent.split(/\r?\n/);
  let i = 0;

  // regex that accepts mm:ss.xxx or hh:mm:ss.xxx, with . or , fractional separator
  const timeRegex =
    /((?:\d{1,2}:)?\d{1,2}:\d{2}[.,]\d{1,3})\s*-->\s*((?:\d{1,2}:)?\d{1,2}:\d{2}[.,]\d{1,3})/;

  while (i < lines.length) {
    let line = lines[i].trim();

    // skip empty lines and header/notes
    if (
      !line ||
      line.toUpperCase().startsWith("WEBVTT") ||
      line.startsWith("NOTE")
    ) {
      i++;
      continue;
    }

    // If the line is a numeric cue index, advance to the next (timecode) line,
    // otherwise treat the current line as potentially the timecode.
    let timeLine;
    if (/^\d+$/.test(line)) {
      i++;
      timeLine = lines[i]?.trim();
    } else {
      timeLine = line;
    }

    const match = timeLine && timeLine.match(timeRegex);
    if (match) {
      const start = vttTimeToSeconds(match[1]);
      const end = vttTimeToSeconds(match[2]);
      i++;
      let text = "";
      while (i < lines.length && lines[i].trim() !== "") {
        text += lines[i].trim() + " ";
        i++;
      }
      blocks.push({ start, end, text: text.trim() });
    } else {
      i++;
    }
  }
  return blocks;
}

export function vttTimeToSeconds(str) {
  // Accepts hh:mm:ss.xxx or mm:ss.xxx, separator . or ,
  if (!str) return 0;
  str = str.replace(",", ".");
  const parts = str.split(":");
  let h = 0,
    m = 0,
    s = 0,
    ms = "0";
  if (parts.length === 3) {
    h = parseInt(parts[0], 10) || 0;
    m = parseInt(parts[1], 10) || 0;
    [s, ms] = parts[2].split(".");
  } else if (parts.length === 2) {
    m = parseInt(parts[0], 10) || 0;
    [s, ms] = parts[1].split(".");
  } else {
    return 0;
  }
  s = parseInt(s || "0", 10);
  ms = String(ms || "0")
    .padEnd(3, "0")
    .slice(0, 3); // normalize to milliseconds
  return h * 3600 + m * 60 + s + parseInt(ms, 10) / 1000;
}

export function findInsertPosition(
  notesContent,
  timestamp,
  caption,
  vttBlocks = []
) {
  // Try to find exact caption match (if long enough)
  if (caption && caption.length > 15) {
    const idx = notesContent.indexOf(caption);
    if (idx !== -1) return idx;
  }

  // Try to find the closest VTT block by timestamp
  if (vttBlocks.length && timestamp) {
    const screenshotTime = vttTimeToSeconds(timestamp);
    let matchedBlock = null;
    for (const b of vttBlocks) {
      if (screenshotTime >= b.start) matchedBlock = b;
      else break;
    }
    if (matchedBlock) {
      const idx = notesContent.indexOf(matchedBlock.text);
      if (idx !== -1) return idx;
    }
  }

  // Fallback: insert at the end
  return notesContent.length;
}
