
const express = require("express");
const { signup, login } = require("../controllers/userController");
const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);

module.exports = router;

// const express = require("express");
// const { getDropdownData } = require("../controller/userController");
// const router = express.Router();

// router.get("/dropdown-data", getDropdownData);

// module.exports = router;
