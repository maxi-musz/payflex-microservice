const errorhandler = (err, req, res, next) => {
    console.log(err.stack);

    return res.status(err.status || 500).json({
        message: err.message || "internal server error",
    })
}

export default errorhandler;