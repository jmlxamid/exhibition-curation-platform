const axios = require("axios");

exports.handler = async function (event, context) {
  // CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  // Handle OPTIONS request
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: "Preflight call successful" }),
    };
  }

  // Parse query parameters
  const queryParams = event.queryStringParameters || {};
  const page = queryParams.page || 1;
  const pageSize = queryParams.pageSize || 10;
  const artist = queryParams.artist || "";
  const sortBy = queryParams.sortBy || "relevance";

  // API keys should be set in the Netlify environment variables
  const RIJKSMUSEUM_API_KEY = process.env.RIJKSMUSEUM_API_KEY;
  const HARVARD_ART_MUSEUMS_API_KEY = process.env.HARVARD_ART_MUSEUMS_API_KEY;

  if (!RIJKSMUSEUM_API_KEY || !HARVARD_ART_MUSEUMS_API_KEY) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "API configuration error",
        rijksKey: RIJKSMUSEUM_API_KEY ? "present" : "missing",
        harvardKey: HARVARD_ART_MUSEUMS_API_KEY ? "present" : "missing",
      }),
    };
  }

  try {
    console.log("Fetching artworks with params:", {
      page,
      pageSize,
      artist,
      sortBy,
    });
    let combinedArtworks = [];

    // Fetch from Rijksmuseum
    try {
      const rijksResponse = await axios.get(
        `https://www.rijksmuseum.nl/api/en/collection?key=${RIJKSMUSEUM_API_KEY}&format=json&p=${page}&ps=${pageSize}&involvedMaker=${encodeURIComponent(
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

    // Fetch from Harvard Art Museums
    try {
      const harvardResponse = await axios.get(
        `https://api.harvardartmuseums.org/object?apikey=${HARVARD_ART_MUSEUMS_API_KEY}&size=${pageSize}&page=${page}&sort=${sortBy}&person=${encodeURIComponent(
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

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(combinedArtworks),
    };
  } catch (error) {
    console.error("General error fetching artworks:", error.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Error fetching artworks",
        message: error.message,
      }),
    };
  }
};
