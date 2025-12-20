# 🚀 Reddit Clone Project

A full-stack Reddit clone built using the **MERN** stack (MongoDB, Express, React, Node.js).

## 🛠️ Prerequisites

* **Node.js** (v14 or higher)
* **MongoDB** (Local or Atlas)

---

## 💻 Local Setup Instructions

Follow these steps to get the application running on your local machine.

### 1. Backend Setup

Navigate to the backend folder and install the dependencies:

```bash
cd backend
npm install
npm install @google/generative-ai

Create a file named .env in the backend directory and add this configuration:

MONGO_URI=mongodb+srv://AHZ404:ahmed200411$@cluster0.gzmnhy4.mongodb.net/
db_Name=reddit_clone
JWT_SECRET=ed492b4d07d4fddce26a131f9566394bfa31acda8d35b49963cc7c4a1fb4dad22899e39739c1ab54b5695277fdb133943a0e9ef328048f7759795c0fb29524dd
JWT_EXPIRES_IN=7d
PORT=3000
NODE_ENV=development

GEMINI_API_KEY=AIzaSyBP2Mgy70IFJLAIH_WnMaIv0LdQKNQOZ2s


Start the backend server:

npm start




### 2. Frontend Setup

cd frontend
npm install

Start the React application:
npm run dev
