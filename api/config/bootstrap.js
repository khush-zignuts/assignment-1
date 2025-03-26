const Admin = require("../models/Admin");
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcrypt");
const { created_by } = require("../models/CommonField");

const adminBootstrap = async () => {
  try {
    const existingAdmin = await Admin.findOne({
      where: { isDeleted: false },
    });

    console.log("existingAdmin: \n", existingAdmin);

    if (existingAdmin === null) {
      const admindata = {
        id: uuidv4(),
        name: "admins",
        email: "admin123@gmail.com",
        password: "Admin@123",
        gender: "male",
        city: "city",
        country: "country",
        created_at: new Date(), // Set current timestamp
        created_by: "admins",
      };

      console.log("admindata: ", admindata);
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(admindata.password, salt);

      const newAdmin = await Admin.create(admindata);
      // console.log(newAdmin);
    }
    return true;
  } catch (error) {
    console.error("Error in Bootstrap:", error.message);
  }
};

module.exports = adminBootstrap;
