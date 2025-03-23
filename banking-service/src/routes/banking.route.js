import express from "express";
import {getAllAccounts} from "../controllers/account.controller.js"

const bankingRoutes = express.Router()

bankingRoutes
.route("/accounts")
.get(getAllAccounts)

export default bankingRoutes