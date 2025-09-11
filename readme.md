project-root/
│── server.js              # Entry point
│── config/
│   └── paths.js           # Centralized paths & constants
│── utils/
│   ├── fileUtils.js       # sanitizeFilename, file-related helpers
│   └── vttUtils.js        # parseVTT, vttTimeToSeconds
│── routes/
│   ├── subtitles.js       # /save-subtitles route
│   └── screenshots.js     # /screenshorts-with-timestamps route
│── controllers/
│   ├── subtitlesController.js
│   └── screenshotsController.js
