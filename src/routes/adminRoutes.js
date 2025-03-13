const express = require("express");
const { login , deleteUser  } = require("../controllers/adminController");
const router = express.Router();
const categoryRoutes = require("./categoryRoutes");

//authentication
// router.post("/signup", signup);
router.post("/login", login);

//delete user:
router.delete("/deleteUser", deleteUser);

//categories:
router.use("/category", categoryRoutes);

module.exports = router;