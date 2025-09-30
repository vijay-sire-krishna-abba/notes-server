export function parseVTT(vttContent) {
  const blocks = [];
  const lines = vttContent.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();
    if (/^\d+$/.test(line)) {
      i++;
      const timeLine = lines[i]?.trim();
      // Updated regex: supports hh:mm:ss.mmm or mm:ss.mmm
      const match = timeLine.match(
        /((?:\d{2}:)?\d{2}:\d{2}\.\d{3})\s*-->\s*((?:\d{2}:)?\d{2}:\d{2}\.\d{3})/
      );
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
      }
    }
    i++;
  }
  return blocks;
}

export function vttTimeToSeconds(str) {
  // Accepts hh:mm:ss.mmm or mm:ss.mmm
  const parts = str.split(":");
  let h = 0,
    m = 0,
    s = 0,
    ms = 0;
  if (parts.length === 3) {
    h = parseInt(parts[0]);
    m = parseInt(parts[1]);
    [s, ms] = parts[2].split(".");
  } else if (parts.length === 2) {
    m = parseInt(parts[0]);
    [s, ms] = parts[1].split(".");
  }
  return h * 3600 + m * 60 + parseInt(s) + parseInt(ms || "0") / 1000;
}

// ...existing code...

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
