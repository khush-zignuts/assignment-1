const express = require("express");
const {
  addAccount,
  getAllAccounts,
  deleteAccount,
  updateAccount,
} = require("../../../controllers/user/account/UserAccountController");
const checkUser = require("../../../middlewares/checkUser");

const router = express.Router();

router.use("/add", checkUser, addAccount);
router.use("/update", checkUser, updateAccount);
router.use("/delete", checkUser, deleteAccount);

router.get("/getAll", checkUser, getAllAccounts);

module.exports = router;
