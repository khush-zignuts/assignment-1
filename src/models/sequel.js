const sequelize = require("../config/db");
const User = require("../config/db");

const syncDatabase = async () => {
    try {
      await sequelize.sync({ force: false, alter: true });
      console.log("Database synced successfully!");
    } catch(error) {
      console.error("Database sync error:", error);
    }
  };

  module.exports = { User, syncDatabase };