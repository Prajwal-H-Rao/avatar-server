require("dotenv").config();
const express = require("express");
const axios = require("axios");
const app = express();
const cors = require("cors");

app.use(cors());
app.use(express.json());

// In-memory storage for video IDs and their corresponding response objects
const videoRequests = {};

// Add error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// Handle uncaught exceptions and rejections
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

app.post("/webhook", async (req, res) => {
  console.log("Webhook request received:", req.body);
  const { id: videoId, status, result_url } = req.body;

  if (!videoId) {
    return res.status(400).send("Missing video ID");
  }

  console.log(`Received webhook for videoId: ${videoId}, status: ${status}`);

  try {
    if (status === "done") {
      console.log(`Video processing completed. Video URL: ${result_url}`);

      if (videoRequests[videoId]) {
        const response = videoRequests[videoId];

        // Check if response hasn't already been sent
        if (!response.res.headersSent) {
          response.res.json({
            result_url: result_url,
            message: "Video processing completed.",
          });
        }

        // Clean up
        delete videoRequests[videoId];
      }
    }
    res.status(200).send("Webhook received");
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).send("Internal server error");
  }
});

app.post("/create-video", async (req, res) => {
  const inputText = req.body.text;

  if (!inputText) {
    return res.status(400).json({ error: "Text input is required." });
  }

  try {
    const createResponse = await axios.post(
      "https://api.d-id.com/talks",
      {
        script: {
          type: "text",
          input: inputText,
        },
        source_url:
          "https://images.pexels.com/photos/762020/pexels-photo-762020.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
        webhook: "https://avatar-server-oo5b.onrender.com/webhook",
      },
      {
        headers: {
          Authorization: `Basic ${process.env.D_ID_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 10000, // 10-second timeout
      }
    );

    const videoId = createResponse.data.id;

    // Add timeout for video processing
    const processingTimeout = setTimeout(() => {
      if (videoRequests[videoId] && !videoRequests[videoId].res.headersSent) {
        videoRequests[videoId].res
          .status(504)
          .json({ error: "Video processing timeout" });
        delete videoRequests[videoId];
      }
    }, 300000); // 5 minutes timeout

    videoRequests[videoId] = { res, timeout: processingTimeout };
  } catch (error) {
    console.error("API Error:", error.response?.data || error.message);
    const statusCode = error.response?.status || 500;
    res.status(statusCode).json({
      error: "Failed to process video",
      details: error.response?.data || error.message,
    });
  }
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown handling
const shutdown = () => {
  console.log("Shutting down server...");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });

  // Force close after 5 seconds
  setTimeout(() => {
    console.error("Forcing shutdown");
    process.exit(1);
  }, 5000);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
