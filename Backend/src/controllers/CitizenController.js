const Citizen = require("../models/CitizenModel");

// GET ALL CITIZENS
const getAllCitizens = async (req, res) => {
  try {
    const citizens = await Citizen.find();

    res.status(200).json({
      success: true,
      count: citizens.length,
      data: citizens,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: "Error fetching citizens",
    });
  }
};


// GET LIMITED CITIZENS 
const getCitizensLimited = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const citizens = await Citizen.find().limit(limit);

    res.status(200).json({
      success: true,
      count: citizens.length,
      data: citizens,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: "Error fetching limited citizens",
    });
  }
};


//GET CITIZEN BY ID 
const getCitizenById = async (req, res) => {
  try {
    const { id } = req.params;

    const citizen = await Citizen.findOne({ citizen_id: id });

    if (!citizen) {
      return res.status(404).json({
        success: false,
        message: "Citizen not found",
      });
    }

    res.status(200).json({
      success: true,
      data: citizen,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: "Error fetching citizen",
    });
  }
};


//FILTER CITIZENS
const filterCitizens = async (req, res) => {
  try {
    const filters = req.body;

    // Example filters:
    // { age: { $gt: 60 }, income_annual: { $lt: 100000 } }

    const citizens = await Citizen.find(filters);

    res.status(200).json({
      success: true,
      count: citizens.length,
      data: citizens,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: "Error filtering citizens",
    });
  }
};


module.exports = {
  getAllCitizens,
  getCitizensLimited,
  getCitizenById,
  filterCitizens,
};