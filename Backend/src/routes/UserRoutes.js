
const routes = require("express").Router();
const userController = require("../controllers/userController.js");

routes.post("/signup", userController.signup);
routes.post("/login", userController.login);
routes.post("/getuser", userController.getUserData);


module.exports = routes;