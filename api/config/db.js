const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    dialect: "postgres",
    logging: false,
    define: {
      timestamps: false, // Automatically add createdAt & updatedAt fields
    },
  }
);

// Test the database connection
(async () => {
  try {
    await sequelize.authenticate();
    console.log(" Connected to PostgreSQL Database  OKfully!");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
})();

module.exports = sequelize;
