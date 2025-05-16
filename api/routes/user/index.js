const express = require("express");
const router = express.Router();
const userAuthRoutes = require("./auth/authRoutes");
const userAccountRoutes = require("./account/accountRoutes");
<<<<<<< Updated upstream
const DropDownRoutes = require("./dropDownRoutes");
=======
const dropDownRoutes = require("./dropDown/dropDownRoutes");

>>>>>>> Stashed changes
//authentication
router.use("/auth", userAuthRoutes);

//account
router.use("/Account", userAccountRoutes);

<<<<<<< Updated upstream
router.use("/dropDown", DropDownRoutes);
=======
//dropDown:
router.use("/dropDown", dropDownRoutes);
>>>>>>> Stashed changes

module.exports = router;
