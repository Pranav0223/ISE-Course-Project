const express = require("express");
const router = express.Router();

const citizenController = require("../controllers/CitizenController");

// GET all citizens
router.get("/citizen", citizenController.getAllCitizens);

// GET limited citizens 
router.get("/limitedCitizens", citizenController.getCitizensLimited);

// GET citizen by ID
router.get("/citizen/:id", citizenController.getCitizenById);

// FILTER citizens
router.post("/CitizenFilter", citizenController.filterCitizens);

module.exports = router;