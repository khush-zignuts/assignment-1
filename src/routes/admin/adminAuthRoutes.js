const express = require("express");
const { signup, login , deleteUser  } = require("../../controllers/Admin/adminAuthController");
const router = express.Router();

//auth User
router.post("/signup", signup);
router.post("/login", login);

//delete user:
router.delete("/deleteUser", deleteUser);


module.exports = router;