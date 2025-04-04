let currentPage = 1;
const pageSize = 10;
let exhibitions = [];

// Global error handler for images
document.addEventListener(
  "error",
  function (e) {
    if (e.target.tagName.toLowerCase() === "img") {
      e.target.style.display = "none";
    }
  },
  true
);

function truncateText(text, maxLength = 50) {
  return text && text.length > maxLength
    ? text.substring(0, maxLength) + "..."
    : text || "Untitled";
}

async function fetchArtworks(page = 1, artist = "", sortBy = "relevance") {
  try {
    const container = document.getElementById("artworks-container");
    container.innerHTML = `
      <div class="col-12 text-center p-5">
        <div class="spinner-border loading-spinner text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-3">Searching collections...</p>
      </div>
    `;

    const response = await fetch(
      `/api/artworks?page=${page}&pageSize=${pageSize}&artist=${encodeURIComponent(
        artist
      )}&sortBy=${sortBy}`
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API error:", errorText);
      container.innerHTML = `
        <div class="col-12">
          <div class="alert alert-danger p-4">
            <i class="fas fa-exclamation-triangle me-2"></i>
            Error loading artworks: ${response.status} ${response.statusText}
            <p class="mt-2 mb-0 small">Please try again or contact support if the issue persists.</p>
          </div>
        </div>
      `;
      return [];
    }

    const data = await response.json();
    console.log(`Received ${data.length} artworks`);

    // Update prev button state
    const prevButton = document.getElementById("prev-button");
    if (prevButton) {
      prevButton.disabled = page <= 1;
      prevButton.classList.toggle("opacity-50", page <= 1);
    }

    displayArtworks(data);
    return data;
  } catch (error) {
    console.error("Error fetching artworks:", error);
    document.getElementById("artworks-container").innerHTML = `
      <div class="col-12">
        <div class="alert alert-danger p-4">
          <i class="fas fa-exclamation-triangle me-2"></i>
          Error loading artworks. Please try again later.
          <p class="mt-2 mb-0 small">${error.message}</p>
        </div>
      </div>
    `;
    return [];
  }
}

function displayArtworks(artworks) {
  const container = document.getElementById("artworks-container");
  if (!container) return;

  if (artworks.length === 0) {
    container.innerHTML = `
      <div class="col-12">
        <div class="empty-state">
          <i class="fas fa-search"></i>
          <h4>No artworks found</h4>
          <p class="text-muted">Try different search criteria or explore other artists.</p>
          <button class="btn btn-outline-primary mt-3" onclick="resetSearch()">
            <i class="fas fa-sync-alt me-2"></i>Reset Search
          </button>
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = "";

  artworks.forEach((artwork) => {
    const isRijks = artwork.objectNumber !== undefined;
    const museumName = isRijks ? "Rijksmuseum" : "Harvard Art Museums";
    const museumClass = isRijks ? "bg-primary" : "bg-info";

    const artworkElement = document.createElement("div");
    artworkElement.className = "artwork col-sm-6 col-md-4 col-lg-3 mb-4";

    // Store artwork data as a data attribute instead of trying to pass it directly to the function
    const artworkId = `artwork-${Date.now()}-${Math.floor(
      Math.random() * 10000
    )}`;

    // Store the artwork data in a dedicated object that can be accessed globally
    window[artworkId] = artwork;

    const artistName =
      artwork.principalOrFirstMaker ||
      (artwork.people && artwork.people[0]
        ? artwork.people[0].name
        : "Unknown Artist");

    const fallbackImage = "https://placehold.co/300x300?text=No+Image";
    const safeImageUrl =
      artwork.webImage?.url || artwork.primaryimageurl || fallbackImage;

    // Ensure consistent card heights by using truncated text for title and description
    const truncatedTitle = truncateText(artwork.title, 60);
    const truncatedArtist = truncateText(artistName, 40);

    artworkElement.innerHTML = `
      <div class="card h-100 position-relative">
        <span class="badge ${museumClass} museum-tag">${museumName}</span>
        <div class="position-relative overflow-hidden artwork-img-container">
          <img src="${safeImageUrl}" 
            alt="${truncatedTitle}" 
            class="card-img-top" 
            onerror="this.onerror=null; this.src='${fallbackImage}'; this.classList.add('img-error');"
          >
        </div>
        <div class="card-body d-flex flex-column">
          <h5 class="card-title text-truncate" title="${
            artwork.title || "Untitled"
          }">${truncatedTitle}</h5>
          <p class="card-text artwork-artist text-truncate" title="${artistName}">
            <i class="fas fa-user-paintbrush me-1"></i> ${truncatedArtist}
          </p>
          <div class="artwork-card-actions mt-auto">
            <button class="btn btn-primary btn-sm" onclick="saveToExhibition('${artworkId}')">
              <i class="fas fa-bookmark me-1"></i> Add to Exhibition
            </button>
          </div>
        </div>
      </div>
    `;
    container.appendChild(artworkElement);
  });

  document.getElementById("page-info").textContent = `Page ${currentPage}`;

  document
    .querySelector(".card-header h4 i.fa-image")
    .closest(".card")
    .scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
}

function resetSearch() {
  currentPage = 1;
  document.getElementById("artist-filter").value = "";
  document.getElementById("sort-by").value = "relevance";
  fetchArtworks(currentPage);
}

function saveToExhibition(artworkId) {
  // Get the artwork data from the global object
  const artwork = window[artworkId];
  if (!artwork) {
    console.error("Artwork data not found");
    return;
  }

  const exhibitionSelector = document.getElementById("exhibition-selector");
  const modal = new bootstrap.Modal(document.getElementById("exhibitionModal"));

  exhibitionSelector.innerHTML = "";

  if (exhibitions.length === 0) {
    exhibitionSelector.innerHTML = `<option value="">No exhibitions yet</option>`;
  } else {
    exhibitionSelector.innerHTML = `<option value="">-- Select an exhibition --</option>`;
    exhibitions.forEach((exhibition) => {
      const option = document.createElement("option");
      option.value = exhibition.name;
      option.textContent = exhibition.name;
      exhibitionSelector.appendChild(option);
    });
  }

  // Store the artwork ID to retrieve it later when saving
  document
    .getElementById("current-artwork")
    .setAttribute("data-artwork-id", artworkId);

  modal.show();
}

function createOrAddToExhibition() {
  const exhibitionSelector = document.getElementById("exhibition-selector");
  const newExhibitionInput = document.getElementById("new-exhibition");
  const artworkId = document
    .getElementById("current-artwork")
    .getAttribute("data-artwork-id");

  if (!artworkId) {
    console.error("No artwork ID found");
    return;
  }

  // Get the artwork data from the global object
  const artwork = window[artworkId];
  if (!artwork) {
    console.error("Artwork data not found");
    return;
  }

  let exhibitionName;

  if (newExhibitionInput.value.trim()) {
    exhibitionName = newExhibitionInput.value.trim();
  } else {
    exhibitionName = exhibitionSelector.value;
  }

  if (!exhibitionName) {
    alert("Please select an existing exhibition or create a new one.");
    return;
  }

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
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-cubes"></i>
        <h4>No exhibitions created yet</h4>
        <p class="text-muted">Search for artworks and add them to create your first exhibition.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="card mb-4">
      <div class="card-header">
        <h4 class="mb-0">
          <i class="fas fa-cubes me-2"></i>Your Exhibitions
        </h4>
      </div>
      <div class="card-body">
        <div id="exhibitions-list" class="accordion">
        </div>
      </div>
    </div>
  `;

  const exhibitionsList = document.getElementById("exhibitions-list");

  exhibitions.forEach((exhibition, index) => {
    const exhibitionElement = document.createElement("div");
    exhibitionElement.className = "accordion-item";

    const exhibitionId = `exhibition-${index}`;
    const headerId = `heading-${index}`;
    const collapseId = `collapse-${index}`;

    exhibitionElement.innerHTML = `
      <h2 class="accordion-header" id="${headerId}">
        <button class="accordion-button ${
          index === 0 ? "" : "collapsed"
        }" type="button" 
                data-bs-toggle="collapse" data-bs-target="#${collapseId}" 
                aria-expanded="${
                  index === 0 ? "true" : "false"
                }" aria-controls="${collapseId}">
          <div class="d-flex align-items-center justify-content-between w-100">
            <span><i class="fas fa-cube me-2"></i>${exhibition.name}</span>
            <span class="badge bg-primary ms-2">${
              exhibition.items.length
            } artwork${exhibition.items.length !== 1 ? "s" : ""}</span>
          </div>
        </button>
      </h2>
      <div id="${collapseId}" class="accordion-collapse collapse ${
      index === 0 ? "show" : ""
    }" 
           aria-labelledby="${headerId}" data-bs-parent="#exhibitions-list">
        <div class="accordion-body">
          <div class="d-flex justify-content-end mb-3">
            <button class="btn btn-danger btn-sm" onclick="deleteExhibition('${
              exhibition.name
            }')">
              <i class="fas fa-trash-alt me-1"></i> Delete Exhibition
            </button>
          </div>
          <div class="row" id="${exhibitionId}">
          ${
            exhibition.items.length === 0
              ? `<p class="text-center text-muted">No items in this exhibition yet.</p>`
              : ""
          }
          </div>
        </div>
      </div>
    `;

    exhibitionsList.appendChild(exhibitionElement);

    if (exhibition.items.length > 0) {
      const itemsContainer = document.getElementById(exhibitionId);

      exhibition.items.forEach((item) => {
        const itemElement = document.createElement("div");
        itemElement.className = "col-sm-6 col-md-4 col-lg-3 mb-3";

        // Determine museum source
        const isRijks = item.objectNumber !== undefined;
        const museumName = isRijks ? "Rijksmuseum" : "Harvard";
        const museumClass = isRijks ? "bg-primary" : "bg-info";

        const artistName =
          item.principalOrFirstMaker ||
          (item.people && item.people[0]
            ? item.people[0].name
            : "Unknown Artist");

        const fallbackImage = "https://placehold.co/100x100?text=No+Image";
        const safeImageUrl =
          item.webImage?.url || item.primaryimageurl || fallbackImage;
        const truncatedTitle = truncateText(item.title, 30);

        itemElement.innerHTML = `
          <div class="card h-100 position-relative">
            <span class="badge ${museumClass} museum-tag">${museumName}</span>
            <img src="${safeImageUrl}" 
              alt="${truncatedTitle}" 
              class="card-img-top" 
              style="height: 120px; object-fit: cover;" 
              onerror="this.onerror=null; this.src='${fallbackImage}'; this.classList.add('img-error');"
            >
            <div class="card-body">
              <h6 class="card-title text-truncate" title="${
                item.title || "Untitled"
              }">${truncatedTitle}</h6>
              <p class="card-text small artwork-artist text-truncate" title="${artistName}">${artistName}</p>
              <button class="btn btn-danger btn-sm w-100" 
                onclick="removeFromExhibition('${exhibition.name}', '${
          item.id || item.objectNumber
        }')">
                <i class="fas fa-times me-1"></i>Remove
              </button>
            </div>
          </div>
        `;

        itemsContainer.appendChild(itemElement);
      });
    }
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

    // Show confirmation
    const toast = new bootstrap.Toast(document.getElementById("saveToast"));
    document.getElementById(
      "toastBody"
    ).textContent = `Artwork removed from "${exhibitionName}"`;
    toast.show();
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

    const toast = new bootstrap.Toast(document.getElementById("saveToast"));
    document.getElementById(
      "toastBody"
    ).textContent = `Exhibition "${exhibitionName}" deleted`;
    toast.show();
  }
}

function saveExhibitionsToLocalStorage() {
  localStorage.setItem("exhibitions", JSON.stringify(exhibitions));
}

function loadExhibitionsFromLocalStorage() {
  const stored = localStorage.getItem("exhibitions");
  if (stored) {
    exhibitions = JSON.parse(stored);
  }
}

// Initialize page
document.addEventListener("DOMContentLoaded", function () {
  loadExhibitionsFromLocalStorage();
  displayExhibitions();
  fetchArtworks(currentPage);

  // Set up event listeners
  document.getElementById("prev-button").addEventListener("click", function () {
    if (currentPage > 1) {
      currentPage--;
      fetchArtworks(
        currentPage,
        document.getElementById("artist-filter").value,
        document.getElementById("sort-by").value
      );
    }
  });

  document.getElementById("next-button").addEventListener("click", function () {
    currentPage++;
    fetchArtworks(
      currentPage,
      document.getElementById("artist-filter").value,
      document.getElementById("sort-by").value
    );
  });

  document
    .getElementById("filter-button")
    .addEventListener("click", function () {
      currentPage = 1;
      fetchArtworks(
        currentPage,
        document.getElementById("artist-filter").value,
        document.getElementById("sort-by").value
      );
    });

  document
    .getElementById("save-exhibition-button")
    .addEventListener("click", createOrAddToExhibition);
});
