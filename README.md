🚀 Reddit Clone Project

A full-stack Reddit Clone built using the MERN stack:

MongoDB

Express.js

React

Node.js

🛠️ Prerequisites

Make sure you have the following installed on your system:

Node.js (v14 or higher)

MongoDB (Local installation or MongoDB Atlas)

💻 Local Setup Instructions

Follow the steps below to run the project locally.

🔧 1. Backend Setup

Navigate to the backend directory:

cd backend


Install backend dependencies:

npm install
npm install @google/generative-ai


Create a .env file inside the backend directory and add the following configuration:

MONGO_URI=mongodb+srv://AHZ404:ahmed200411$@cluster0.gzmnhy4.mongodb.net/
db_Name=reddit_clone

JWT_SECRET=ed492b4d07d4fddce26a131f9566394bfa31acda8d35b49963cc7c4a1fb4dad22899e39739c1ab54b5695277fdb133943a0e9ef328048f7759795c0fb29524dd
JWT_EXPIRES_IN=7d

PORT=3000
NODE_ENV=development

GEMINI_API_KEY=AIzaSyBP2Mgy70IFJLAIH_WnMaIv0LdQKNQOZ2s


Start the backend server:

npm start


The backend should now be running on http://localhost:3000
.

🎨 2. Frontend Setup

Navigate to the frontend directory:

cd frontend


Install frontend dependencies:

npm install


Start the React development server:

npm run dev
