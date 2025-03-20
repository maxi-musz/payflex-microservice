import { z } from "zod";
import moment from "moment";

export const registerSchema = z.object({
  first_name: z.string().min(2, "First name must be at least 2 characters long").max(50).trim(),
  last_name: z.string().min(2, "Last name must be at least 2 characters long").max(50).trim(),
  email: z.string().email("Invalid email format").toLowerCase().trim(),
  phone_number: z.string().min(2).max(15).trim(),
  address: z.object({
    country: z.string().min(2).max(20).trim(),
    state: z.string().min(2).max(50).trim(),
    city: z.string().min(2).max(50).trim(),
    home_address: z.string().min(2).max(50).trim(),
  }),
  gender: z.enum(["male", "female"], { message: "Gender must be either 'male' or 'female'" }),
  date_of_birth: z.string().regex(/^\d{2}-\d{2}-\d{4}$/, "Date must be in DD-MM-YYYY format"),
  password: z.string().min(6, "Password must be at least 6 characters long").max(30),
  confirm_password: z.string().min(6, "Confirm Password must be at least 6 characters long").max(30),
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords must match",
  path: ["confirm_password"],
});


// Login schema
export const loginSchema = z.object({
  email: z
    .string()
    .email("Invalid email format")
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(6, "Password must be at least 8 characters long")
    .max(30, "Password must not exceed 100 characters"),
});

// Login schema
export const requestEmailOTPSchema = z.object({
  email: z
    .string()
    .email("Invalid email format")
    .toLowerCase()
    .trim()
});

// verify otp schema
export const verifyOTPSchema = z.object({
  email: z
    .string()
    .email("Invalid email format")
    .toLowerCase()
    .trim(),
  code: z
    .string()
    .min(4, "Password must be at least 4 characters long")
    .max(4, "Password must not exceed 4 characters"),
});

export const updatePasswordSchema = z.object({
  email: z
    .string()
    .email("Invalid email format")
    .toLowerCase()
    .trim(),
  new_password: z
    .string()
    .min(6, "Password must be at least 8 characters long")
    .max(30, "Password must not exceed 100 characters"),
});