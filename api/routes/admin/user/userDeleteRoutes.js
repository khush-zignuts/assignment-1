const express = require("express");
const router = express.Router();
const {
  deleteUser,
  getAll,
} = require("../../../controllers/admin/user/userAction");

//delete user:
router.delete("/delete/:userId", deleteUser);
router.get("/getAll", getAll);

module.exports = router;
