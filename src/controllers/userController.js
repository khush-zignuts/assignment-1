const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
  // const { t } = req; // Get translation function



module.exports = { 
  signup : async (req, res) => {
    // const { t } = req; // Get translation function
    try {
      const { name, email, password, country, city } = req.body;
      console.log('req.body: ', req.body);
      
  
      const existingUser = await User.findOne({ where: { email } });
      // if (existingUser) return res.status(400).json({ message: t("email_exists") });
      if (existingUser) return res.status(400).json({ message: "exist user" });

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

  
      const newUser = await User.create({ name, email, password : hashedPassword, country, city });
      // res.status(201).json({ message: t("signup_success"), user: newUser });
      res.status(201).json({ message: "signup success", user: newUser });

    } catch (error) {
      console.log(error.message)
      res.status(500).json({ message: "Error signing up", error });
    }
  },

  login : async (req, res) => {
    // const { t } = req;
    try {
      const { email, password } = req.body;
      console.log(' req.body: ',  req.body);
  
      const user = await User.findOne({ where: { email } });
      console.log('user: ', user);


      const isPasswordCorrect = await bcrypt.compare(password, user.password);
  
      if (!(isPasswordCorrect)) {
        return res.status(401).json({ message:"invalid_credentials" });
        // return res.status(401).json({ message: t("invalid_credentials") });
  
      }
  
      const token = jwt.sign({ id: user.id }, process.env.SECRET_KEY, { expiresIn: "1d" });
      res.json({ message: "Login successful!", token });
    } catch (error) {
      console.log(error.message )
      res.status(500).json({ message: "Login error", error});
    }
  }
}
