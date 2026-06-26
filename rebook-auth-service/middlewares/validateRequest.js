// rebook-auth-service/middleware/validateRequest.js
const validateRequest = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false, // Return ALL errors at once, not just the first one
            stripUnknown: true // Automatically remove any malicious unexpected fields sent by hackers
        });

        if (error) {
            // Format Joi's complex error array into a clean key-value object for the frontend
            const formattedErrors = error.details.reduce((acc, currentError) => {
                const key = currentError.path[0];
                acc[key] = currentError.message.replace(/"/g, ''); // Remove ugly quotation marks
                return acc;
            }, {});

            return res.status(400).json({ 
                status: 'VALIDATION_FAILED',
                errors: formattedErrors 
            });
        }

        // Replace req.body with the sanitized, validated values
        req.body = value;
        next();
    };
};

module.exports = validateRequest;