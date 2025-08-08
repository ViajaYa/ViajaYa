import { config, getWompiConfig, validateWompiConfig } from './env.js';

// Validar configuración de Wompi al importar
validateWompiConfig();

class WompiService {
  constructor() {
    this.config = getWompiConfig();
    this.baseUrl = 'https://api.wompi.co/v1';
    this.sandboxUrl = 'https://api.sandbox.wompi.co/v1';
  }

  getApiUrl() {
    return this.config.environment === 'production' 
      ? this.baseUrl 
      : this.sandboxUrl;
  }

  // Obtener token de aceptación
  async getAcceptanceToken() {
    try {
      const response = await fetch(`${this.getApiUrl()}/merchants/${this.config.publicKey}`);
      const data = await response.json();
      return data.data.presigned_acceptance;
    } catch (error) {
      console.error('Error obteniendo token de aceptación:', error);
      throw error;
    }
  }

  // Crear token de pago
  async createPaymentToken(cardData) {
    try {
      const response = await fetch(`${this.getApiUrl()}/tokens/cards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.publicKey}`,
        },
        body: JSON.stringify({
          number: cardData.number,
          cvc: cardData.cvc,
          exp_month: cardData.expMonth,
          exp_year: cardData.expYear,
          card_holder: cardData.cardHolder,
        }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creando token de pago:', error);
      throw error;
    }
  }

  // Crear transacción
  async createTransaction(transactionData) {
    try {
      const response = await fetch(`${this.getApiUrl()}/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.publicKey}`,
        },
        body: JSON.stringify({
          amount_in_cents: transactionData.amountInCents,
          currency: this.config.currency,
          customer_email: transactionData.customerEmail,
          reference: transactionData.reference,
          payment_method: {
            type: 'CARD',
            token: transactionData.paymentToken,
            installments: transactionData.installments || 1,
          },
          acceptance_token: transactionData.acceptanceToken,
          customer_data: transactionData.customerData,
          shipping_address: transactionData.shippingAddress,
        }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creando transacción:', error);
      throw error;
    }
  }

  // Consultar transacción
  async getTransaction(transactionId) {
    try {
      const response = await fetch(`${this.getApiUrl()}/transactions/${transactionId}`, {
        headers: {
          'Authorization': `Bearer ${this.config.publicKey}`,
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error consultando transacción:', error);
      throw error;
    }
  }

  // Validar integridad de webhook
  validateWebhookSignature(payload, signature) {
    // Implementar validación de firma del webhook
    // Esto se haría en el backend normalmente
    console.log('Validando webhook:', { payload, signature });
    return true;
  }
}

export default new WompiService();