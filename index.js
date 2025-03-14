require("dotenv").config();
const axios = require("axios");

const API_KEY = process.env.API_KEY;
const API_URL = "https://api.d-id.com/talks";

const createVideo = async () => {
  try {
    const response = await axios.post(
      API_URL,
      {
        script: {
          type: "text",
          input: "Hello! I am your AI assistant. How can I help you today?",
        },
        source_url:
          "https://images.pexels.com/photos/1933873/pexels-photo-1933873.jpeg?auto=compress&cs=tinysrgb&w=600",
      },
      {
        headers: {
          Authorization: `Basic ${API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Video created:", response.data);
  } catch (error) {
    console.error(
      "Error creating video:",
      error.response ? error.response.data : error.message
    );
  }
};

createVideo();
