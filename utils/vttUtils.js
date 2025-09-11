export function parseVTT(vttContent) {
  const blocks = [];
  const lines = vttContent.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();
    if (/^\d+$/.test(line)) {
      i++;
      const timeLine = lines[i]?.trim();
      const match = timeLine.match(
        /(\d{2}:\d{2}:\d{2}\.\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}\.\d{3})/
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
  const [h, m, s] = str.split(":");
  const [sec, ms] = s.split(".");
  return (
    parseInt(h) * 3600 +
    parseInt(m) * 60 +
    parseInt(sec) +
    parseInt(ms || "0") / 1000
  );
}
