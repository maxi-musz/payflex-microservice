import bcrypt from "bcrypt";

export const hashValue = async (value, saltRounds = 10) => {
  return await bcrypt.hash(value, saltRounds);
};

export const compareValue = async (value, hashedValue) => {
  return await bcrypt.compare(value, hashedValue);
};
