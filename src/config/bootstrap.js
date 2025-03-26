const Admin = require("../models/Admin");
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcrypt");
const { STATUS_CODES } = require("./constants");
const Validator = require("validatorjs");
const { VALIDATION_RULES } = require("./validationRules");

const validateRequest = (data, rules, res) => {
  const validation = new Validator(data, rules);
  if (validation.fails()) {
    res
      .status(STATUS_CODES.BAD_REQUEST)
      .json({ message: validation.errors.all() });
    return false;
  }
  return true;
};

const adminBootstrap = async () => {
  try {
    if (!validateRequest(req.body, VALIDATION_RULES.ADMIN, res)) return;
    const existingAdmin = await Admin.findAll({});
    // console.log("existingAdmin: ", existingAdmin);

    // if (existingAdmin.length == 0) {
    //   const admindata = {
    //     id: uuidv4(),
    //     name: "admins",
    //     email: "admin123@gmail.com",
    //     password: "Admin@123",
    //     gender: "male",
    //     city: "city",
    //     country: "country",
    //     company_name: "zignuts",
    //   };

    if (existingAdmin.length == 0) {
      const admindata = {
        // id: uuidv4(),
        id: "086d67a7-3a4d-427c-bd8e-fa2cb5a5ac34",
        name: "jk1",
        email: "jk1@gmail.com",
        password: "012345678",
        gender: "male",
        city: "city",
        country: "country",
        company_name: "zignuts",
      };

      // console.log("admindata: ", admindata);

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(admindata.password, salt);

      const newAdmin = await Admin.create({
        id: admindata.id,
        name: admindata.name,
        email: admindata.email,
        password: hashedPassword,
        gender: admindata.gender,
        city: admindata.city,
        country: admindata.country,
        companyName: admindata.company_name,
      });
      // console.log(newAdmin);
    }
    return true;
  } catch (error) {
    console.error("Error in Bootstrap:", error.message);
  }
};

module.exports = adminBootstrap;
