const express = require("express");
const router = express.Router();
const {
  deleteUser,
} = require("../../../controllers/admin/user/DeleteUserController");

//delete user:
router.delete("/deleteUser/:userId", deleteUser);

module.exports = router;
