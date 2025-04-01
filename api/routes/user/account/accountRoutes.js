const express = require("express");
const {
  addAccount,
  getAllAccounts,
  deleteAccount,
  updateAccount,
} = require("../../../controllers/user/account/UserAccountController");
const checkUser = require("../../../middlewares/checkUser");

const router = express.Router();

router.post("/add", checkUser, addAccount);
router.post("/update", checkUser, updateAccount);
router.delete("/delete/:accountId", checkUser, deleteAccount);

router.get("/getAll", checkUser, getAllAccounts);

module.exports = router;
