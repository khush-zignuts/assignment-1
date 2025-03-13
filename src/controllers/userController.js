const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

module.exports = {
  signup: async (req, res) => {
    const { t } = req; // Get translation function
    try {
      const { name, email, password, country, city, companyName } = req.body;
      console.log("req.body: ", req.body);

      const existingUser = await User.findOne({ where: { email } });
      const existingAdmin = await Admin.findOne({ where: { email } });

      if (existingUser || existingAdmin) {
        return res
          .status(400)
          .json({ message: t("api.auth.signup.emailExists") });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const newUser = await User.create({
        name,
        email,
        password: hashedPassword,
        country,
        city,
        companyName,
      });
      // res.status(201).json({ message: t("signup_success"), user: newUser });
      res
        .status(201)
        .json({ message: t("api.auth.signup.success"), user: newUser });
    } catch (error) {
      console.log(error.message);
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
        return res.status(400).json({
          message:
            t("api.auth.login.missingFields") ||
            "Email and password are required.",
        });
      }

      const user = await User.findOne({ where: { email } });
      console.log("user: ", user);

      const isPasswordCorrect = await bcrypt.compare(password, user.password);

      if (!isPasswordCorrect) {
        return res
          .status(401)
          .json({ message: t("api.auth.login.invalidCredentials") });
        // return res.status(401).json({ message: t("invalid_credentials") });
      }

      const token = jwt.sign({ id: user.id }, process.env.SECRET_KEY, {
        expiresIn: "1d",
      });

      user.accessToken = token;
      await user.save(); // ✅ Fixed: Now correctly updating instance

      res.json({ message: t("api.auth.login.success"), token });
    } catch (error) {
      console.log(error.message);
      res.status(500).json({ message: t("api.errors.serverError"), error });
    }
  },

  logout : async (req, res) => {
    try {
        const { userId } = req.params; // Assuming userId is passed in request body

        if (!userId) {
            return res.status(400).json({  message: t("api.auth.logout.invalidCredentials") });
        }

        // Find user by ID
        const user = await User.findOne({ where: { id: userId } });

        if (!user) {
            return res.status(404).json({  message: t("api.auth.logout.invalidCredentials") });
        }

        // Set accessToken to NULL (logout)
        await User.update(
            { accessToken: null }, 
            { where: { id: userId } }
        );

        return res.status(200).json({ message: t("api.auth.logout.success")});
    } catch (error) {
        console.error("Logout error:", error);
        return res.status(500).json({ message: t("api.errors.serverError") });
    }
  }
};
