const axios = require("axios");

exports.handler = async function (event, context) {
  // Enable CORS
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: "CORS enabled" }),
    };
  }

  try {
    // Parse query parameters
    const params = event.queryStringParameters || {};
    const page = parseInt(params.page) || 1;
    const pageSize = parseInt(params.pageSize) || 10;
    const artist = params.artist || "";
    const sortBy = params.sortBy || "relevance";

    const RIJKSMUSEUM_API_KEY = process.env.RIJKSMUSEUM_API_KEY;
    const HARVARD_ART_MUSEUMS_API_KEY = process.env.HARVARD_ART_MUSEUMS_API_KEY;
    const USE_DUMMY_DATA = process.env.USE_DUMMY_DATA === "true";

    if (USE_DUMMY_DATA) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(getDummyData(page, pageSize, artist)),
      };
    }

    const offset = (page - 1) * pageSize;

    const rijksPromise = axios.get(
      "https://www.rijksmuseum.nl/api/en/collection",
      {
        params: {
          key: RIJKSMUSEUM_API_KEY,
          q: artist,
          p: page,
          ps: Math.ceil(pageSize / 2), // Split the results between two APIs
          imgonly: true,
          s: mapSortBy(sortBy, "rijks"),
        },
      }
    );

    const harvardPromise = axios.get(
      "https://api.harvardartmuseums.org/object",
      {
        params: {
          apikey: HARVARD_ART_MUSEUMS_API_KEY,
          q: artist,
          page: page,
          size: Math.floor(pageSize / 2), // Split the results between two APIs
          hasimage: 1,
          sort: mapSortBy(sortBy, "harvard"),
        },
      }
    );

    const [rijksResponse, harvardResponse] = await Promise.all([
      rijksPromise,
      harvardPromise,
    ]);

    const rijksArtworks = rijksResponse.data.artObjects || [];
    const harvardArtworks = harvardResponse.data.records || [];

    const combinedResults = [...rijksArtworks, ...harvardArtworks];

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(combinedResults),
    };
  } catch (error) {
    console.log("Error fetching artworks:", error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Failed to fetch artworks",
        message: error.message,
      }),
    };
  }
};

function mapSortBy(sortBy, api) {
  if (api === "rijks") {
    switch (sortBy) {
      case "artist":
        return "artist";
      case "date":
        return "chronologic";
      case "relevance":
      default:
        return "relevance";
    }
  } else if (api === "harvard") {
    switch (sortBy) {
      case "artist":
        return "people";
      case "date":
        return "datebegin";
      case "relevance":
      default:
        return "rank";
    }
  }
}
function getDummyData(page, pageSize, artist) {
  const dummyArtworks = [];

  for (let i = 0; i < Math.ceil(pageSize / 2); i++) {
    const id = `rijks-${page}-${i}`;
    dummyArtworks.push({
      id,
      objectNumber: `SK-C-${page}${i}`,
      title: `Artwork ${id}${artist ? ` by ${artist}` : ""}`,
      principalOrFirstMaker: artist || `Artist ${i}`,
      webImage: {
        url: `https://placehold.co/300x300?text=Rijks+${page}.${i}`,
      },
    });
  }

  for (let i = 0; i < Math.floor(pageSize / 2); i++) {
    const id = `harvard-${page}-${i}`;
    dummyArtworks.push({
      id,
      title: `Artwork ${id}${artist ? ` by ${artist}` : ""}`,
      people: [{ name: artist || `Artist ${i}` }],
      primaryimageurl: `https://placehold.co/300x300?text=Harvard+${page}.${i}`,
    });
  }

  return dummyArtworks;
}
