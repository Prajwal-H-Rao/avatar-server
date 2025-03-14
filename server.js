require("dotenv").config();
const express = require("express");
const axios = require("axios");
const app = express();
const cors = require("cors");

app.use(cors());
app.use(express.json());

// In-memory storage for video IDs and their corresponding response objects
const videoRequests = {};

app.post("/webhook", async (req, res) => {
  console.log("Webhook request received:", req.body); // Log the entire request body
  const { id: videoId, status, result_url } = req.body;

  console.log(`Received webhook for videoId: ${videoId}, status: ${status}`);

  if (status === "done") {
    console.log(`Video processing completed. Video URL: ${result_url}`);

    // Check if we have a corresponding request
    if (videoRequests[videoId]) {
      // Send the result_url back to the client
      const response = videoRequests[videoId];
      response.res.json({
        result_url: result_url,
        message: "Video processing completed.",
      });

      // Clean up the stored request
      delete videoRequests[videoId];
    }
  }

  // Respond to the webhook
  res.status(200).send("Webhook received");
});

app.post("/create-video", async (req, res) => {
  const inputText = req.body.text; // Extract the text input from the request body
  console.log(req.body);

  if (!inputText) {
    return res.status(400).json({ error: "Text input is required." });
  }

  try {
    // 1. Create video request to D-ID
    const createResponse = await axios.post(
      "https://api.d-id.com/talks",
      {
        script: {
          type: "text",
          input: inputText, // Use the input text from the request
        },
        source_url:
          "https://images.pexels.com/photos/762020/pexels-photo-762020.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2", // Replace with actual URL
        webhook: "https://40c1-49-207-248-225.ngrok-free.app/webhook", // Hardcoded webhook URL
      },
      {
        headers: {
          Authorization: `Basic ${process.env.D_ID_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const videoId = createResponse.data.id;

    // Store the response object for later use
    videoRequests[videoId] = { res: res };

    // Return the video ID to the client
    // res.json({ videoId: videoId, message: "Video creation initiated." });
  } catch (error) {
    console.error("Error:", error.response?.data || error.message);
    res.status(500).json({
      error: "Failed to process video",
      details: error.response?.data || error.message,
    });
  }
});

const PORT = 5000; // Hardcoded port
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
