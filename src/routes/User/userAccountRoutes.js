const express = require("express");
const {
  addAccount,
  getAllAccounts,
} = require("../../controllers/User/userAccountController");
const checkUser = require("../../middlewares/checkUser");

const router = express.Router();

router.use("/addAccount", checkUser, addAccount);

// router.get("/accounts/:accountId", getAccountById);

router.get("/getAllAccounts", checkUser, getAllAccounts);

module.exports = router;
