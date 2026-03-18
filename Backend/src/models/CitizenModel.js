const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const citizenSchema = new Schema(
  {
    citizen_id: {
      type: Number,
      required: true,
      unique: true,
    },

    age: {
      type: Number,
      required: true,
      min: 0,
      max: 120,
    },

    gender: {
      type: String,
      required: true,
      enum: ["Male", "Female", "Other"],
      trim: true,
    },

    marital_status: {
      type: String,
      required: true,
      enum: ["Single", "Married", "Widowed", "Divorced"],
      trim: true,
    },

    state: {
      type: String,
      required: true,
      trim: true,
    },

    rural_urban: {
      type: String,
      required: true,
      enum: ["Rural", "Urban"],
      trim: true,
    },

    social_category: {
      type: String,
      required: true,
      enum: ["General", "OBC", "SC", "ST"],
      trim: true,
    },

    occupation: {
      type: String,
      required: true,
      trim: true,
    },

    income_annual: {
      type: Number,
      required: true,
      min: 0,
    },

    disability: {
      type: Boolean,
      required: true,
    },

    education_level: {
      type: String,
      required: true,
      enum: [
        "No Schooling",
        "Primary",
        "Middle School",
        "Higher Secondary",
        "Graduate",
        "Post-Graduate",
      ],
      trim: true,
    },

    bpl_status: {
      type: String,
      required: true,
      enum: ["BPL", "APL"],
      trim: true,
    },
  },
  {
    timestamps: true, 
  },
);

module.exports = mongoose.model("citizen", citizenSchema);
