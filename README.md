# Exhibition Curation Platform

A web application that allows users to explore and curate virtual exhibitions from combined collections of antiquities and fine art from the Rijksmuseum and Harvard Art Museums.

## Features

- Search and browse artworks from multiple museum collections
- Filter by artist name and sort results
- Pagination navigation to browse through large collections
- View artwork details including images and artist information
- Create and manage multiple personal exhibitions
- Save artworks to exhibitions and remove them as needed
- Persistent storage of exhibitions using browser localStorage

## Technologies Used

- Frontend: HTML, CSS, JavaScript, Bootstrap 5
- Backend: Node.js, Express
- APIs: Rijksmuseum API, Harvard Art Museums API
- Deployment: [Your hosting platform here, e.g., Netlify, Heroku, GitHub Pages]

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm (comes with Node.js)
- API keys for:
  - [Rijksmuseum API](https://www.rijksmuseum.nl/en/research/conduct-research/data)
  - [Harvard Art Museums API](https://harvardartmuseums.org/collections/api)

### Installation

1. Clone the repository:

   ```
   git clone https://github.com/yourusername/exhibition-curation-platform.git
   cd exhibition-curation-platform
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Create a `.env` file in the root directory with your API keys:

   ```
   RIJKSMUSEUM_API_KEY=your_rijksmuseum_api_key
   HARVARD_ART_MUSEUMS_API_KEY=your_harvard_art_museums_api_key
   ```

4. Start the development server:

   ```
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:5000`

## Deployment

This project can be deployed to any static hosting service. Here's how to deploy to Netlify:

1. Create a `netlify.toml` file in the root directory:

   ```
   [build]
     command = "npm run build"
     publish = "public"

   [functions]
     directory = "functions"
   ```

2. Create a `functions` directory and move your API calls to serverless functions.

3. Connect your GitHub repository to Netlify and follow the deployment instructions.

## Usage

1. **Searching for Artworks**:

   - Enter an artist name in the search box
   - Select a sorting method (relevance, artist, or date)
   - Click "Apply Filters" button

2. **Browsing Artworks**:

   - Use the "Previous" and "Next" buttons to navigate through pages
   - View artwork details including image, title, and artist

3. **Creating Exhibitions**:

   - Click "Save to Exhibition" on any artwork
   - Create a new exhibition or select an existing one
   - View all your exhibitions at the bottom of the page

4. **Managing Exhibitions**:
   - Remove individual artworks from exhibitions
   - Delete entire exhibitions

## License

## Acknowledgments

- [Rijksmuseum API](https://data.rijksmuseum.nl/)
- [Harvard Art Museums API](https://github.com/harvardartmuseums/api-docs)
