const validateRequest = (schema) => (req, res, next) => {
    try {
      req.body = schema.parse(req.body); // Parse & validate the request body
      next();
    } catch (error) {
      console.log("❌ Validation failed:", error.errors);
      return res.status(400).json({ 
        success: false,
        message: "Validation error", 
        errors: error.errors
       });
    }
  };
  
  export default validateRequest;
  