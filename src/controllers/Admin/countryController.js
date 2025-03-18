// const User = require("../../models/User");
// const { MasterCountry, MasterCountryTrans } = require("../../models");
// const { Op } = require("sequelize");
// const { v4: uuidv4 } = require("uuid");
// const MasterCity = require("../../models/MasterCity");
// const MasterCityTrans = require("../../models/MasterCityTrans");

// module.exports = {
//   addCountry: async (req, res) => {
//     const { t } = req; // Get translation function
//     try {
//       let countries = req.body;
//       console.log("countries: ", countries);

//       if (!Array.isArray(countries) || countries.length === 0) {
//         return res
//           .status(400)
//           .json({ message: t("api.countries.invalidInput") });
//       }

//       // // Prepare data for bulk insert
//       let countryData = [];

//       for (let i = 0; i < countries.length; i++) {
//         const { name, lang } = countries[i];

//         if (!name || !lang) {
//           return res
//             .status(400)
//             .json({ message: "Both name and lang are required" });
//         }

//         countryData.push({ name: name.toLowerCase(), lang });
//       }

//       // Check for existing  country
//       const existingCountry = await MasterCountryTrans.findOne({
//         where: {
//           name: {
//             [Op.in]: countryData.map((c) => c.name),
//           },
//         },
//       });

//       if (existingCountry) {
//         return res.status(400).json({ message: "country already exists" });
//       }

//       // Generate UUID for Mastercountry
//       const master_country_id = uuidv4();
//       console.log("master_country_id: ", master_country_id);

//       // Create master-country || cat_id put in master country table
//       const country = await MasterCountry.create({
//         id: master_country_id,
//       });

//       // Insert Translations Using `bulkCreate`
//       let country_trans = [];
//       for (let i = 0; i < countryData.length; i++) {
//         country_trans.push({
//           master_country_id,
//           name: countryData[i].name,
//           lang: countryData[i].lang,
//         });
//       }

//       // Create master-category-trans
//       await MasterCountryTrans.bulkCreate(country_trans);

//       return res.status(201).json({
//         message: t("api.countries.addSuccess"),
//         // status,
//         master_country_id,
//         // data,
//         // error,
//       });
//     } catch (error) {
//       console.error(error);
//       return res
//         .status(500)
//         .json({ message: t("api.errors.serverError"), error });
//     }
//   },
//   addCity: async (req, res) => {
//     const { t } = req; // Get translation function
//     try {
//       let cities = req.body;
//       console.log("cities: ", cities);

//       if (!Array.isArray(cities) || cities.length === 0) {
//         return res.status(400).json({ message: t("api.cities.invalidInput") });
//       }

//       let cityData = [];

//       for (let i = 0; i < cities.length; i++) {
//         const { countryId, name, lang } = cities[i];

//         if (!name || !lang || !countryId) {
//           return res
//             .status(400)
//             .json({ message: "Both name and lang are required" });
//         }

//         cityData.push({ countryId, name: name.toLowerCase(), lang });
//       }

//       // // Check for existing category
//       const existingCity = await MasterCityTrans.findOne({
//         where: {
//           name: {
//             [Op.in]: cityData.map((c) => c.name),
//           },
//         },
//       });

//       if (existingCity) {
//         return res.status(400).json({ message: "City already exists" });
//       }

//       // Generate UUID for MasterCity
//       const master_City_id = uuidv4();
//       console.log("master_City_id: ", master_City_id);

//       // // Create master-category || cat_id put in master category table
//       const City = await MasterCity.create({
//         id: master_City_id,
//         countryId: cityData[0].countryId,
//       });

//       console.log("City: ", City);

//       // // Insert Translations Using `bulkCreate`
//       let City_trans = [];
//       for (let i = 0; i < cityData.length; i++) {
//         City_trans.push({
//           master_city_id: master_City_id,
//           name: cityData[i].name,
//           lang: cityData[i].lang,
//         });
//       }
//       console.log("City_trans: ", City_trans)

//        // // Create master-category-trans
//        await MasterCityTrans.bulkCreate(City_trans);


//       return res
//         .status(201)
//         .json({ message: t("api.cities.addSuccess"),   master_City_id, });
//     } catch (error) {
//       console.error(error);
//       return res
//         .status(500)
//         .json({ message: t("api.errors.serverError"), error });
//     }
//   },
// };
