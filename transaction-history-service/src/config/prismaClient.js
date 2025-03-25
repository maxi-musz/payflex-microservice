import { PrismaClient } from "@prisma/client";
import colors from "colors";

const prisma = new PrismaClient();

prisma
  .$connect()
  .then(() => console.log(colors.blue("✅ transaction history service pg-db connected successfully")))
  .catch((err) => {
    console.error(colors.red("❌ transaction history service pg-db connection error:"), err);
    process.exit(1);
  });

export default prisma;