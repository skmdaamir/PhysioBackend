const db = require("./dbConnection");

// JSON Data (you can import this from a file if preferred)
const districtsData = {
  districts: [
    { district_id: 791, district_name: "Chamba" },
    { district_id: 795, district_name: "Kangra" },
    { district_id: 792, district_name: "Kinnaur" },
    { district_id: 793, district_name: "Mandi" },
    { district_id: 794, district_name: "Shimla" },
  ],
};

// Set your state_id here
const stateId = 39;

async function insertCities() {
//   const connection = await mysql.createConnection(dbConfig);

  const insertQuery = `
    INSERT INTO cities (city_name, state_id)
    VALUES (?, ?)
  `;

  try {
    for (const district of districtsData.districts) {
      const {district_name } = district;
      await db.execute(insertQuery, [
        district_name,
        stateId,
      ]);
      console.log(`Inserted: ${district_name}`);
    }
    console.log("All districts inserted successfully.");
  } catch (err) {
    console.error("Error inserting cities:", err);
  } finally {
    await db.end();
  }
}

insertCities();
