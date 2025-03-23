import { PrismaClient } from "@prisma/client";
import colors from "colors";

const prisma = new PrismaClient();

prisma
  .$connect()
  .then(() => console.log(colors.blue("✅ Postgres Database connected successfully")))
  .catch((err) => {
    console.error(colors.red("❌ Database connection error:"), err);
    process.exit(1);
  });

export default prisma;