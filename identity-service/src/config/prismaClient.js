import { PrismaClient } from "@prisma/client";
import colors from "colors";

// Determine the database URL based on environment
const databaseUrl = process.env.NODE_ENV === 'production'
  ? process.env.DATABASE_URL_RENDER_EXTERNAL
  : process.env.DATABASE_URL;

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl
    }
  }
});

prisma
  .$connect()
  .then(() => console.log(colors.blue("✅ Postgres Database connected successfully")))
  .catch((err) => {
    console.error(colors.red("❌ Database connection error:"), err);
    process.exit(1);
  });

export default prisma; 