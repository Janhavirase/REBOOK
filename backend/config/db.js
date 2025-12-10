const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // Attempt to connect to the database using the URI from your .env file
    const conn = await mongoose.connect(process.env.MONGO_URI);
    
    // Log success message if connection works
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    // Log error and exit process if connection fails
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;