import express from "express";
import { saveSubtitles } from "../controllers/subtitlesController.js";

const router = express.Router();

router.post("/save-subtitles", saveSubtitles);

export default router;
