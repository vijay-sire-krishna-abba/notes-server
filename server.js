import express from "express";
import cors from "cors";
import { PORT } from "./config/paths.js";
import subtitlesRoutes from "./routes/subtitles.js";
import screenshotsRoutes from "./routes/screenshots.js";

const app = express();

// Middlewares
app.use(express.json({ limit: "50mb" }));
app.use(cors()); // replaces manual CORS headers

// Routes
app.use("/", subtitlesRoutes);
app.use("/", screenshotsRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
