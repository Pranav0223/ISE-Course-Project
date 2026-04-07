require("dotenv").config();
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");  // ← FIX 1: import cors

// ← FIX 2: add CORS BEFORE all routes
app.use(cors({
  origin: [
    'http://localhost:5173',   // Vite web frontend (dev)
    'http://127.0.0.1:5173',
    'http://localhost:3000',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));


app.use(express.json());

const userRoutes = require("./src/routes/UserRoutes.js");
app.use('/api/users', userRoutes);

const citizenRoutes = require("./src/routes/CitizenRoutes.js");
app.use('/api/citizens', citizenRoutes);

const parsePolicyRoutes = require('./src/routes/parsePolicyRoutes');
app.use('/api/parse-policy', parsePolicyRoutes);

const simulationRoutes = require('./src/routes/simulationRoutes');
app.use('/api/simulate', simulationRoutes);


const mongooseURI =
  process.env.MONGO_URI;
const PORT = process.env.PORT || 5000;



mongoose
  .connect(mongooseURI)
  .then(() => {
    console.log("database connected.......");
  })
  .catch((err) => {
    console.error("FULL ERROR:", err);
  });

app.listen(PORT, '0.0.0.0', () => {
  console.log(`server is started on port number : ${PORT}`);
});
