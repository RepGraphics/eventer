const bcrypt = require('bcryptjs');

const generatePassword = async (plainPassword) => {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);
    console.log(`Plain Password: ${plainPassword}`);
    console.log(`Hashed Password: ${hashedPassword}`);
};

// Example usage
const plainPassword = 'test';
generatePassword(plainPassword);
