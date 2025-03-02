let currentPage = 1;
const pageSize = 10;
let exhibitions = [];

async function fetchArtworks(page = 1, artist = "", sortBy = "relevance") {
  try {
    const container = document.getElementById("artworks-container");
    container.innerHTML =
      '<div class="col-12 text-center"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>';

    const response = await fetch(
      `/api/artworks?page=${page}&pageSize=${pageSize}&artist=${encodeURIComponent(
        artist
      )}&sortBy=${sortBy}`
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API error:", errorText);
      container.innerHTML = `<div class="alert alert-danger col-12">Error loading artworks: ${response.status} ${response.statusText}</div>`;
      return [];
    }

    const data = await response.json();
    console.log(`Received ${data.length} artworks`);
    displayArtworks(data);
    return data;
  } catch (error) {
    console.error("Error fetching artworks:", error);
    document.getElementById(
      "artworks-container"
    ).innerHTML = `<div class="alert alert-danger col-12">Error loading artworks. Please try again later.</div>`;
    return [];
  }
}

function displayArtworks(artworks) {
  const container = document.getElementById("artworks-container");
  if (!container) return;

  if (artworks.length === 0) {
    container.innerHTML = `<div class="alert alert-info col-12">No artworks found. Try different search criteria.</div>`;
    return;
  }

  container.innerHTML = "";

  artworks.forEach((artwork) => {
    const artworkElement = document.createElement("div");
    artworkElement.className = "artwork col-md-4 mb-4";

    // Safely stringify artwork for the onclick function
    const safeArtwork = JSON.stringify(artwork)
      .replace(/'/g, "\\'")
      .replace(/"/g, '\\"');

    artworkElement.innerHTML = `
      <div class="card h-100">
        <img src="${
          artwork.webImage?.url ||
          artwork.primaryimageurl ||
          "https://via.placeholder.com/200x200?text=No+Image"
        }" 
          alt="${artwork.title || "Untitled"}" 
          class="card-img-top" style="height: 200px; object-fit: cover;">
        <div class="card-body">
          <h5 class="card-title">${artwork.title || "Untitled"}</h5>
          <p class="card-text">${
            artwork.principalOrFirstMaker ||
            artwork.people?.[0]?.name ||
            "Unknown Artist"
          }</p>
          <button class="btn btn-primary btn-sm" onclick='saveToExhibition(${safeArtwork})'>
            Save to Exhibition
          </button>
        </div>
      </div>
    `;
    container.appendChild(artworkElement);
  });

  // Update pagination status
  document.getElementById("page-info").textContent = `Page ${currentPage}`;
}

function saveToExhibition(artwork) {
  // First check if we have exhibitions or create a select dropdown
  const exhibitionSelector = document.getElementById("exhibition-selector");

  const modal = new bootstrap.Modal(document.getElementById("exhibitionModal"));

  // Populate exhibition dropdown
  exhibitionSelector.innerHTML = "";
  exhibitions.forEach((exhibition) => {
    const option = document.createElement("option");
    option.value = exhibition.name;
    option.textContent = exhibition.name;
    exhibitionSelector.appendChild(option);
  });

  // Show the modal
  modal.show();

  // Store the artwork in a data attribute to use later
  document
    .getElementById("current-artwork")
    .setAttribute("data-artwork", JSON.stringify(artwork));
}

function createOrAddToExhibition() {
  const exhibitionSelector = document.getElementById("exhibition-selector");
  const newExhibitionInput = document.getElementById("new-exhibition");
  const artworkData = document
    .getElementById("current-artwork")
    .getAttribute("data-artwork");

  if (!artworkData) return;

  const artwork = JSON.parse(artworkData);
  let exhibitionName;

  // Check if we're creating a new exhibition or using an existing one
  if (newExhibitionInput.value.trim()) {
    exhibitionName = newExhibitionInput.value.trim();
  } else {
    exhibitionName = exhibitionSelector.value;
  }

  if (!exhibitionName) {
    alert("Please select an existing exhibition or create a new one.");
    return;
  }

  // Now add to the exhibition
  let exhibition = exhibitions.find((e) => e.name === exhibitionName);
  if (!exhibition) {
    exhibition = { name: exhibitionName, items: [] };
    exhibitions.push(exhibition);
  } else {
    // Check for duplicates
    const isDuplicate = exhibition.items.some(
      (item) =>
        item.id === artwork.id || item.objectNumber === artwork.objectNumber
    );

    if (isDuplicate) {
      alert(`This artwork is already in "${exhibitionName}"`);
      return;
    }
  }

  exhibition.items.push(artwork);

  // Close the modal and reset fields
  const modal = bootstrap.Modal.getInstance(
    document.getElementById("exhibitionModal")
  );
  modal.hide();
  newExhibitionInput.value = "";

  // Show confirmation
  const toast = new bootstrap.Toast(document.getElementById("saveToast"));
  document.getElementById(
    "toastBody"
  ).textContent = `Added to "${exhibitionName}"`;
  toast.show();

  // Update exhibitions display
  displayExhibitions();

  // Save to localStorage
  saveExhibitionsToLocalStorage();
}

function displayExhibitions() {
  const container = document.getElementById("exhibitions-container");
  if (!container) return;

  if (exhibitions.length === 0) {
    container.innerHTML = "<p>No exhibitions created yet.</p>";
    return;
  }

  container.innerHTML = "<h2 class='mt-4 mb-3'>Your Exhibitions</h2>";

  exhibitions.forEach((exhibition) => {
    const exhibitionElement = document.createElement("div");
    exhibitionElement.className = "exhibition card mb-4";

    const headerHtml = `
      <div class="card-header d-flex justify-content-between align-items-center">
        <h3 class="mb-0">${exhibition.name}</h3>
        <button class="btn btn-sm btn-danger" onclick='deleteExhibition("${exhibition.name}")'>
          Delete Exhibition
        </button>
      </div>
    `;

    let itemsHtml = `<div class="card-body"><div class="row">`;

    if (exhibition.items.length === 0) {
      itemsHtml += `<p>No items in this exhibition yet.</p>`;
    } else {
      exhibition.items.forEach((item) => {
        itemsHtml += `
          <div class="col-md-3 mb-3">
            <div class="card h-100">
              <img src="${
                item.webImage?.url ||
                item.primaryimageurl ||
                "https://via.placeholder.com/100x100?text=No+Image"
              }" 
                alt="${item.title || "Untitled"}" 
                class="card-img-top" style="height: 120px; object-fit: cover;">
              <div class="card-body">
                <h6 class="card-title">${item.title || "Untitled"}</h6>
                <p class="card-text small">${
                  item.principalOrFirstMaker ||
                  item.people?.[0]?.name ||
                  "Unknown Artist"
                }</p>
                <button class="btn btn-danger btn-sm" 
                  onclick='removeFromExhibition("${exhibition.name}", "${
          item.id || item.objectNumber
        }")'>Remove</button>
              </div>
            </div>
          </div>
        `;
      });
    }

    itemsHtml += `</div></div>`;
    exhibitionElement.innerHTML = headerHtml + itemsHtml;
    container.appendChild(exhibitionElement);
  });
}

function removeFromExhibition(exhibitionName, itemId) {
  const exhibition = exhibitions.find((e) => e.name === exhibitionName);
  if (exhibition) {
    exhibition.items = exhibition.items.filter(
      (item) => item.id !== itemId && item.objectNumber !== itemId
    );
    displayExhibitions();
    saveExhibitionsToLocalStorage();
  }
}

function deleteExhibition(exhibitionName) {
  if (
    confirm(
      `Are you sure you want to delete the exhibition "${exhibitionName}"?`
    )
  ) {
    exhibitions = exhibitions.filter((e) => e.name !== exhibitionName);
    displayExhibitions();
    saveExhibitionsToLocalStorage();
  }
}

function saveExhibitionsToLocalStorage() {
  localStorage.setItem("exhibitions", JSON.stringify(exhibitions));
}

function loadExhibitionsFromLocalStorage() {
  const saved = localStorage.getItem("exhibitions");
  if (saved) {
    exhibitions = JSON.parse(saved);
    displayExhibitions();
  }
}

function setupEventListeners() {
  document.addEventListener("DOMContentLoaded", () => {
    const nextButton = document.getElementById("next-button");
    const prevButton = document.getElementById("prev-button");
    const filterButton = document.getElementById("filter-button");
    const artistFilter = document.getElementById("artist-filter");
    const sortByFilter = document.getElementById("sort-by");
    const saveExhibitionButton = document.getElementById(
      "save-exhibition-button"
    );

    if (nextButton) {
      nextButton.addEventListener("click", () => {
        currentPage++;
        fetchArtworks(
          currentPage,
          artistFilter ? artistFilter.value : "",
          sortByFilter ? sortByFilter.value : "relevance"
        );
      });
    }

    if (prevButton) {
      prevButton.addEventListener("click", () => {
        if (currentPage > 1) {
          currentPage--;
          fetchArtworks(
            currentPage,
            artistFilter ? artistFilter.value : "",
            sortByFilter ? sortByFilter.value : "relevance"
          );
        }
      });
    }

    if (filterButton && artistFilter && sortByFilter) {
      filterButton.addEventListener("click", () => {
        currentPage = 1;
        fetchArtworks(currentPage, artistFilter.value, sortByFilter.value);
      });

      // Also allow pressing Enter in the artist filter
      artistFilter.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          currentPage = 1;
          fetchArtworks(currentPage, artistFilter.value, sortByFilter.value);
        }
      });
    }

    if (saveExhibitionButton) {
      saveExhibitionButton.addEventListener("click", createOrAddToExhibition);
    }

    // Load saved exhibitions from local storage
    loadExhibitionsFromLocalStorage();

    // Initial artwork fetch
    fetchArtworks(currentPage);
  });
}

// Ensure the event listeners are set up properly
setupEventListeners();

// For testing purposes
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    fetchArtworks,
    displayArtworks,
    saveToExhibition,
    displayExhibitions,
    exhibitions,
    setupEventListeners,
  };
}
