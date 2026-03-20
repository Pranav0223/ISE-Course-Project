require("dotenv").config();
const express = require("express");
const app = express();
const mongoose = require("mongoose");

app.use(express.json());

const userRoutes = require("./src/routes/UserRoutes.js");
app.use(userRoutes);

const citizenRoutes = require("./src/routes/CitizenRoutes.js");
app.use(citizenRoutes);




const mongooseURI =
  process.env.MONGO_URI;
const PORT = process.env.PORT;



mongoose
  .connect(mongooseURI)
  .then(() => {
    console.log("database connected.......");
  })
  .catch((err) => {
    console.error("FULL ERROR:", err);
  });

app.listen(PORT, () => {
  console.log(`server is started on port number : ${PORT}`);
});
