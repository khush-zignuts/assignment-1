const express = require("express");
const { login , deleteUser  } = require("../../controllers/adminController");
const router = express.Router();

//auth User
// router.post("/signup", signup);
router.post("/login", login);

//delete user:
router.delete("/deleteUser", deleteUser);


module.exports = router;