import { MercadoPagoConfig, Payment, Preference } from 'mercadopago';

if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
  console.warn("MERCADOPAGO_ACCESS_TOKEN não configurado. Sistema de pagamentos não funcionará.");
}

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
  options: {
    timeout: 5000,
    idempotencyKey: 'abc'
  }
});

export class MercadoPagoService {
  private payment = new Payment(client);
  private preference = new Preference(client);

  async createPixPayment(data: {
    amount: number;
    description: string;
    payerName: string;
    payerLastName: string;
    payerCpf: string;
    payerEmail?: string;
    payerPhone?: string;
    externalReference?: string;
  }) {
    try {
      const paymentData = {
        transaction_amount: data.amount,
        description: data.description,
        payment_method_id: 'pix',
        payer: {
          first_name: data.payerName,
          last_name: data.payerLastName,
          identification: {
            type: 'CPF',
            number: data.payerCpf
          },
          email: data.payerEmail || '',
          phone: data.payerPhone ? {
            area_code: data.payerPhone.substring(0, 2),
            number: data.payerPhone.substring(2)
          } : undefined
        },
        external_reference: data.externalReference,
        notification_url: `${process.env.BASE_URL || 'http://localhost:5000'}/api/boost/webhook`,
      };

      const payment = await this.payment.create({ body: paymentData });
      
      return {
        id: payment.id,
        status: payment.status,
        qr_code: payment.point_of_interaction?.transaction_data?.qr_code,
        qr_code_base64: payment.point_of_interaction?.transaction_data?.qr_code_base64,
        payment_method_id: payment.payment_method_id,
        external_reference: payment.external_reference,
        transaction_amount: payment.transaction_amount
      };
    } catch (error) {
      console.error('Erro ao criar pagamento PIX:', error);
      throw new Error('Erro ao processar pagamento');
    }
  }

  async getPayment(paymentId: string) {
    try {
      const payment = await this.payment.get({ id: paymentId });
      
      return {
        id: payment.id,
        status: payment.status,
        status_detail: payment.status_detail,
        external_reference: payment.external_reference,
        transaction_amount: payment.transaction_amount,
        date_approved: payment.date_approved,
        date_created: payment.date_created,
        payer: payment.payer
      };
    } catch (error) {
      console.error('Erro ao buscar pagamento:', error);
      throw new Error('Erro ao buscar status do pagamento');
    }
  }

  async createPreference(data: {
    title: string;
    quantity: number;
    unit_price: number;
    description?: string;
    external_reference?: string;
    payer?: {
      name?: string;
      surname?: string;
      email?: string;
      phone?: {
        area_code?: string;
        number?: string;
      };
      identification?: {
        type?: string;
        number?: string;
      };
    };
  }) {
    try {
      const preferenceData = {
        items: [
          {
            title: data.title,
            quantity: data.quantity,
            unit_price: data.unit_price,
            description: data.description || data.title,
          }
        ],
        external_reference: data.external_reference,
        payer: data.payer,
        notification_url: `${process.env.BASE_URL || 'http://localhost:5000'}/api/boost/webhook`,
        back_urls: {
          success: `${process.env.BASE_URL || 'http://localhost:3000'}/boost/success`,
          failure: `${process.env.BASE_URL || 'http://localhost:3000'}/boost/failure`,
          pending: `${process.env.BASE_URL || 'http://localhost:3000'}/boost/pending`,
        },
        auto_return: 'approved',
      };

      const preference = await this.preference.create({ body: preferenceData });
      
      return {
        id: preference.id,
        sandbox_init_point: preference.sandbox_init_point,
        init_point: preference.init_point,
      };
    } catch (error) {
      console.error('Erro ao criar preferência de pagamento:', error);
      throw new Error('Erro ao criar preferência de pagamento');
    }
  }

  processWebhookNotification(notification: any) {
    try {
      return {
        id: notification.id,
        type: notification.type,
        action: notification.action,
        data_id: notification.data?.id,
        live_mode: notification.live_mode,
        date_created: notification.date_created,
        api_version: notification.api_version,
        user_id: notification.user_id
      };
    } catch (error) {
      console.error('Erro ao processar notificação webhook:', error);
      throw new Error('Erro ao processar notificação');
    }
  }
}

export const mercadoPagoService = new MercadoPagoService();