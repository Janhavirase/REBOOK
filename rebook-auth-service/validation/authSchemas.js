// rebook-auth-service/validation/authSchemas.js
const Joi = require('joi');

const registerSchema = Joi.object({
    name: Joi.string()
        .min(2)
        .max(30)
        .required()
        .messages({
            'string.empty': 'Name cannot be empty',
            'string.min': 'Name must be at least 2 characters long'
        }),

    email: Joi.string()
        .email({ minDomainSegments: 2 })
        .required()
        .messages({
            'string.email': 'Please provide a valid email address',
            'string.empty': 'Email is required'
        }),

    password: Joi.string()
        .min(6)
        .max(32)
        .required()
        .messages({
            'string.min': 'Password must be at least 6 characters long',
            'string.empty': 'Password is required'
        }),

    phone: Joi.string()
        .pattern(/^[0-9]{10,12}$/)
        .required()
        .messages({
            'string.pattern.base': 'Phone number must be a valid numerical length of 10 to 12 digits'
        }),
        
    isAdmin: Joi.boolean().default(false)
});

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
});

module.exports = {
    registerSchema,
    loginSchema
};