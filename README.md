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

Dotenv: Used to manage environment variables safely.

🧩 Key Extensions & Logic
ES Modules ("type": "module"): Used in the backend to maintain consistency with modern JavaScript syntax.

Image Removal Logic: Allows users to clear or replace a captured photo before submission to ensure accuracy.

Map Invalidation: A custom MapFixer component ensures the Leaflet map renders correctly without grey tiles on load.

🐘 PostgreSQL Setup
Install PostgreSQL: Download and install the latest version from postgresql.org.

Setup Database:

Open pgAdmin 4 or your SQL terminal.

Create a new database named nagriksetu.

Navigate to the nagriksetu-backend folder in this repository.

Open the file named db.sql.

Copy and execute the queries inside that file to create the tickets table.

🔐 Environment Variables (.env)
To keep your database credentials secure, create a file named .env inside the nagriksetu-backend directory and add the following:


DB_USER=postgres
DB_PASSWORD=your_password_here
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nagriksetu
PORT=5000
Note: Replace your_password_here with the actual password you set during PostgreSQL installation.

⚙️ How to Run Locally (Laptop Only)
1. Clone the Repository
git clone https://github.com/YOUR_USERNAME/nagriksetu.git
cd nagriksetu
2. Start the Backend Server
Navigate to the backend folder:

cd nagriksetu-backend
Install dependencies:

npm install
Setup .env: Create the .env file as described in the section above.

Folder Setup: Ensure a folder named uploads exists in this directory (it is ignored by Git).

Run the server:

node index.js
3. Start the Frontend App
Open a second terminal and stay in the root/frontend directory.

Install dependencies:

npm install
Config: Ensure BACKEND_URL in App.jsx is set to "http://localhost:5000".

Launch the app:

npm run dev