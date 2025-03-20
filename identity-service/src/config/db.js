import mongoose from "mongoose";
import colors from "colors";
// import { config } from "./app.process.env.js";

const connection = {};

 
async function connectDb() {
  console.log(colors.gray("Connecting to db..."))
  try {
    if (connection.isConnected) {
        console.warn(colors.red("Already connected to the database."));
        return;
      }
      if (mongoose.connections.length > 0) {
        connection.isConnected = mongoose.connections[0].readyState;
        if (connection.isConnected === 1) {
          console.log(colors.red("Use previous connection to the database."));
          return;
        }
        await mongoose.disconnect();
      }
      const db = await mongoose.connect(process.env.MONGO_URI);
      console.log(colors.blue("Successfully connected to the database"));
      connection.isConnected = db.connections[0].readyState;
  } catch (error) {
    console.log(`Error: ${error.message}`);
    process.exit(1);
  } 
}

async function disconnectDb() {
  if (connection.isConnected) {
    if (process.env.NODE_ENV === "production") {
      await mongoose.disconnect();
      connection.isConnected = false;
    } else {
      console.log("not diconnecting from the database.".white);
    }
  }
}
const db = { connectDb, disconnectDb };
export default db;