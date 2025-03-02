const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 5500;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/api/artworks", async (req, res) => {
  const page = req.query.page || 1;
  const pageSize = req.query.pageSize || 10;
  const artist = req.query.artist || "";
  const sortBy = req.query.sortBy || "relevance";

  // Check if API keys are available
  if (
    !process.env.RIJKSMUSEUM_API_KEY ||
    !process.env.HARVARD_ART_MUSEUMS_API_KEY
  ) {
    console.error("Missing API keys");
    return res.status(500).json({
      error: "API configuration error",
      rijksKey: process.env.RIJKSMUSEUM_API_KEY ? "present" : "missing",
      harvardKey: process.env.HARVARD_ART_MUSEUMS_API_KEY
        ? "present"
        : "missing",
    });
  }

  try {
    console.log("Fetching artworks with params:", {
      page,
      pageSize,
      artist,
      sortBy,
    });

    // Use dummy data if we're just testing
    const useDummyData = process.env.USE_DUMMY_DATA === "true";

    let combinedArtworks = [];

    if (useDummyData) {
      console.log("Using dummy data instead of real APIs");
      combinedArtworks = getDummyArtworks();
    } else {
      // Real API calls
      try {
        const rijksResponse = await axios.get(
          `https://www.rijksmuseum.nl/api/en/collection?key=${
            process.env.RIJKSMUSEUM_API_KEY
          }&format=json&p=${page}&ps=${pageSize}&involvedMaker=${encodeURIComponent(
            artist
          )}&s=${sortBy}`
        );
        console.log(
          "Rijksmuseum API success, items:",
          rijksResponse.data.artObjects?.length || 0
        );
        combinedArtworks.push(...(rijksResponse.data.artObjects || []));
      } catch (rijksError) {
        console.error("Rijksmuseum API error:", rijksError.message);
        // Continue with the other API even if this one fails
      }

      try {
        const harvardResponse = await axios.get(
          `https://api.harvardartmuseums.org/object?apikey=${
            process.env.HARVARD_ART_MUSEUMS_API_KEY
          }&size=${pageSize}&page=${page}&sort=${sortBy}&person=${encodeURIComponent(
            artist
          )}`
        );
        console.log(
          "Harvard API success, items:",
          harvardResponse.data.records?.length || 0
        );
        combinedArtworks.push(...(harvardResponse.data.records || []));
      } catch (harvardError) {
        console.error("Harvard Art Museums API error:", harvardError.message);
        // Continue even if this API fails
      }
    }

    console.log(`Returning ${combinedArtworks.length} total artworks`);
    return res.json(combinedArtworks);
  } catch (error) {
    console.error("General error fetching artworks:", error.message);
    return res
      .status(500)
      .json({ error: "Error fetching artworks", message: error.message });
  }
});

// Function to generate dummy artworks for testing
function getDummyArtworks() {
  return [
    {
      id: "1",
      objectNumber: "SK-C-5",
      title: "The Night Watch",
      principalOrFirstMaker: "Rembrandt van Rijn",
      webImage: {
        url: "https://lh3.googleusercontent.com/cRtF3WdYfRQEraAcQz8dWDJOq3XgDRAtwjlPdEucOKKbT_mP9FjLOW5cpUhP3hEL6Bw7pUBLAmR7Q91X6g5NtlOA8w=s0",
      },
    },
    {
      id: "2",
      objectNumber: "SK-A-2344",
      title: "Self-portrait",
      principalOrFirstMaker: "Vincent van Gogh",
      webImage: {
        url: "https://lh3.googleusercontent.com/cRtF3WdYfRQEraAcQz8dWDJOq3XgDRAtwjlPdEucOKKbT_mP9FjLOW5cpUhP3hEL6Bw7pUBLAmR7Q91X6g5NtlOA8w=s0",
      },
    },
    {
      objectid: "3",
      title: "Water Lilies",
      people: [{ name: "Claude Monet" }],
      primaryimageurl: "https://ids.lib.harvard.edu/ids/view/18724328",
    },
  ];
}

const server = app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(
    `API keys status: Rijksmuseum: ${
      process.env.RIJKSMUSEUM_API_KEY ? "Present" : "Missing"
    }, Harvard: ${
      process.env.HARVARD_ART_MUSEUMS_API_KEY ? "Present" : "Missing"
    }`
  );
});

module.exports = { app, server };
