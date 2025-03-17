const User = require("../../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Admin = require("../../models/Admin");
 

module.exports = {
  signup: async (req, res) => {
    const { t } = req; // Get translation function
    try {
      const { name, email, password } = req.body;
      console.log("req.body: ", req.body);

      // Check if email exists in Admin or User table
      const existingAdmin = await Admin.findOne({ where: { email } });
      const existingUser = await User.findOne({ where: { email } });

      if (existingAdmin || existingUser) {
          return res.status(400).json({ message:  t("api.auth.signup.emailExists")  });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const newUser = await Admin.create({
        name,
        email,
        password: hashedPassword,
      });
      // res.status(201).json({ message: t("signup_success"), user: newUser });
      res
        .status(201)
        .json({ message: t("api.auth.signup.success"), user: newUser });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: t("api.errors.serverError"), error });
    }
  },

  login: async (req, res) => {
    const { t } = req;
    try {
      const { email, password } = req.body;
      console.log(" req.body: ", req.body);

      // Validate input
      if (!email || !password) {
        return res
          .status(400)
          .json({
            message:
              t("api.auth.login.missingFields") ||
              "Email and password are required.",
          });
      }

      const admin = await Admin.findOne({ where: { email } });

      // Check if admin exists
      if (!admin) {
        return res
          .status(401)
          .json({ message: t("api.auth.login.invalidCredentials") });
      }
      console.log("admin:", admin.toJSON());

      const isPasswordCorrect = await bcrypt.compare(password, admin.password);

      if (!isPasswordCorrect) {
        return res
          .status(401)
          .json({ message: t("api.auth.login.invalidCredentials") });
      }
      const payload = {
        id: admin.id,
        email: email
      };

      const token = jwt.sign(payload, process.env.SECRET_KEY, {
        expiresIn: "10d",
      });

      //  Save the access token in the database
      admin.accessToken = token;
      await admin.save(); // ✅ Fixed: Now correctly updating instance

      res.json({ message: t("api.auth.login.success"), token });
    } catch (error) {
      console.log(error.message);
      res.status(500).json({ message: t("api.errors.serverError"), error });
    }
  },
  deleteUser: async (req, res) => {
    try {
      const { userId } = req.params; // Get user ID from request param
      console.log('req.params: ', req.params);

      // Check if user exists and is not deleted
      const user = await User.findOne({
        where: {
          id: userId,
          isDeleted: false,
        },
      });

      if (!user) {
        return res
          .status(404)
          .json({ message: "api.auth.delete.usernotFound" });
      }

      // Delete user token
      await User.update(
        { accessToken: null, isDeleted: true, deleted_at: new Date() }, // Clear token
        { where: { id: userId } }
      );

      //   delete user
      // await User.destroy({ where: { id: userId } });

      return res.status(200).json({ message: "api.auth.delete.successDelete" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "api.errors.serverError" });
    }
  },
 
};
