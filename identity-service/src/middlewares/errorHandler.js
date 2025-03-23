import logger from "../common/utils/logger.js";
import colors from "colors"

const errorhandler = (err, req, res, next) => {
    logger.error(colors.red(err.message)); 
    return res.status(err.status || 500).json({
        message: err.message || "internal server error",
    })
}

export default errorhandler;