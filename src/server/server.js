import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import { generateCurriculum } from "./ai.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.join(__dirname, ".env"),
});

const app = express();

const PORT = 5000;

app.use(cors());

app.use(
  express.json({
    limit: "10mb",
  })
);

app.get("/", (req, res) => {
  res.json({
    message: "Lingocare AI server is running",
  });
});

app.post(
  "/api/generate-curriculum",
  async (req, res) => {
    try {
      const { text } = req.body;

      if (!text || !text.trim()) {
        return res.status(400).json({
          success: false,
          message: "PDF text is required",
        });
      }

      // Streaming response
      res.setHeader(
        "Content-Type",
        "text/event-stream"
      );

      res.setHeader(
        "Cache-Control",
        "no-cache"
      );

      res.setHeader(
        "Connection",
        "keep-alive"
      );

      res.flushHeaders();

      console.log("PDF text received.");

      const sendProgress = (data) => {
        res.write(
          `data: ${JSON.stringify(data)}\n\n`
        );
      };

      sendProgress({
        type: "started",
        message: "Starting curriculum generation...",
      });

      const curriculum =
        await generateCurriculum(
          text,
          sendProgress
        );

      sendProgress({
        type: "complete",
        curriculum,
      });

      res.end();

    } catch (error) {
      console.error(
        "AI Error:",
        error.message
      );

      res.write(
        `data: ${JSON.stringify({
          type: "error",
          message:
            error.message ||
            "Something went wrong while generating curriculum.",
        })}\n\n`
      );

      res.end();
    }
  }
);

app.listen(PORT, () => {
  console.log(
    `AI server running on http://localhost:${PORT}`
  );

  console.log(
    "Gemini API key loaded:",
    !!process.env.GEMINI_API_KEY
  );
});