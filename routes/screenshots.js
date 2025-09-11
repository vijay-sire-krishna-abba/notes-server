import express from "express";
import { saveScreenshot } from "../controllers/screenshotsController.js";

const router = express.Router();

router.post("/screenshorts-with-timestamps", saveScreenshot);

export default router;
