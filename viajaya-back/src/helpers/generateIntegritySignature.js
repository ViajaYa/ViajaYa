import crypto from "crypto";

// Función para generar la firma de integridad
export const generateIntegritySignature = (amountInCents, reference, publicKey, privateKey) => {
  const signatureString = `${amountInCents}${reference}${publicKey}${privateKey}`;
  return crypto.createHash("sha256").update(signatureString).digest("hex");
};

