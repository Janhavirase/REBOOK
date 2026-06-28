const { registerSchema } = require('../validation/authSchemas');

describe('Auth Validation Schemas', () => {
    
    it('should successfully validate correct user data', () => {
        // Arrange: Create a perfect user payload
        const validData = {
            name: 'Janvi',
            email: 'janvi.dev@example.com',
            password: 'SecurePassword123!',
            phone: '9876543210'
        };

        // Act: Run it through your Joi schema
        const { error } = registerSchema.validate(validData);

        // Assert: There should be absolutely no errors
        expect(error).toBeUndefined();
    });

    it('should fail validation if the email is missing', () => {
        // Arrange: Create a payload missing the email field
        const invalidData = {
            name: 'Test User',
            password: 'SecurePassword123!',
            phone: '9876543210'
        };

        // Act
        const { error } = registerSchema.validate(invalidData);

        // Assert: Joi should catch the missing email and throw an error
        expect(error).toBeDefined();
        expect(error.details[0].message).toContain('email');
    });
});