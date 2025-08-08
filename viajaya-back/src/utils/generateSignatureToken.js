const jwt = require('jsonwebtoken');

const generateSignatureToken = (contractId) => {
  return jwt.sign(
    { 
      contractId, 
      purpose: 'contract_signature',
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 días
    },
    process.env.JWT_SECRET || 'your-secret-key'
  );
};

const verifySignatureToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
  } catch (error) {
    throw new Error('Token de firma inválido o expirado');
  }
};

module.exports = {
  generateSignatureToken,
  verifySignatureToken
};