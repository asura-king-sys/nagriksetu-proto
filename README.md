🚀 NagrikSetu: Civic Issue Reporting System
NagrikSetu is a web-based platform designed for reporting local civic issues. Users can pinpoint an issue on an interactive map, provide a category, and upload a photo for verification.

🛠 Tech Stack
Frontend
React.js: A library for building a dynamic user interface.

Leaflet & React-Leaflet: Powers the interactive map for precise location picking.

Axios: Manages API calls between the frontend and the backend.

OpenStreetMap (Nominatim): Used for reverse-geocoding coordinates into readable addresses.

Backend
Node.js & Express: The server environment and framework handling our API routes.

Multer: Middleware used to handle multipart/form-data for image uploads.

CORS: Ensures the frontend can communicate with the backend server securely.

PostgreSQL: The database used for storing report data (Category, Lat, Lng, Image Path).

🧩 Key Extensions & Logic
ES Modules ("type": "module"): Used in the backend to maintain consistency with modern JavaScript syntax.

Image Removal Logic: Allows users to clear or replace a captured photo before submission to ensure accuracy.

Map Invalidation: A custom MapFixer component ensures the Leaflet map renders correctly without grey tiles on load.

⚙️ How to Run Locally
1. Clone the Repository
Bash :
git clone https://github.com/YOUR_USERNAME/nagriksetu.git
cd nagriksetu
2. Start the Backend Server
Navigate to the backend folder: cd nagriksetu-backend

Install dependencies: npm install

Folder Setup: Ensure a folder named uploads exists in this directory (it is ignored by Git).

Run the server: node index.js

The server will start at: http://localhost:5000

3. Start the Frontend App
Open a second terminal and stay in the root/frontend directory.

Install dependencies: npm install

Config: Ensure BACKEND_URL in App.jsx is set to "http://localhost:5000".

Launch the app: npm run dev

Open your browser to the URL provided (usually http://localhost:5173).

🐘 PostgreSQL Setup
To store the reports, you must have PostgreSQL installed and running on your laptop.

1. Download & Install
Download: Get the installer for Windows/Mac from the Official PostgreSQL Site.

Installation: Follow the wizard. Important: Remember the password you set for the postgres user.

Tool: The installer includes pgAdmin 4, a visual tool to manage your database.

2. Create the Database
Open pgAdmin 4 or use the terminal (psql).

Create a new database named nagriksetu:

SQL
CREATE DATABASE nagriksetu;
Connect to the database and create the tickets table:

SQL
CREATE TABLE tickets (
    id SERIAL PRIMARY KEY,
    category VARCHAR(50),
    description TEXT,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    image_path TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
3. Connect the Backend
In your nagriksetu-backend folder, ensure you have a .env file (or update your index.js) with your credentials:


DB_USER=postgres
DB_PASSWORD=YOUR_PASSWORD_HERE
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nagriksetu
How to add this in VS Code:
Open your README.md.

Find the "How to Run Locally" section.

Paste these PostgreSQL instructions above the "Start the Backend Server" step.

Final Git Sync:
Once you've saved the changes in VS Code, run these to update your GitHub:

Bash :
git add README.md
git commit -m "docs: add PostgreSQL installation and setup guide"
git push origin main