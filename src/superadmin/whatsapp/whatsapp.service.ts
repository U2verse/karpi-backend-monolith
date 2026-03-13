import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  private readonly GRAPH_URL = 'https://graph.facebook.com/v22.0';
  private readonly PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID!;
  private readonly ACCESS_TOKEN = process.env.WHATSAPP_TOKEN!;

  async sendEnrollmentMessage(
    phone: string,
    academyName: string,
    enrollmentToken: string,
  ) {
    try {
      const url = `${this.GRAPH_URL}/${this.PHONE_NUMBER_ID}/messages`;

      /* const payload = {
        messaging_product: 'whatsapp',
        to: phone, // 91XXXXXXXXXX
        type: 'template',
        template: {
          name: 'karpi_enrollment_form',
          language: { code: 'en_GB' },
          components: [
            {
              type: 'body',
              parameters: [
                {
                  type: 'text',
                  text: academyName, // {{1}}
                },
              ],
            },
            {
              type: 'button',
              sub_type: 'url',
              index: '0',
              parameters: [
                {
                  type: 'text',
                  text: enrollmentToken, // {{2}}
                },
              ],
            },
          ],
        },
      }; */

     /*  const payload = {
        messaging_product: 'whatsapp',
        to: phone, // must be in allowed list
        type: 'template',
        template: {
            name: 'hello_world',
            language: { code: 'en_US' },
        },
        }; */

      const payload = {
        messaging_product: 'whatsapp',
        to: phone, // E.164 format: 91XXXXXXXXXX
        type: 'template',
        template: {
          name: 'enrollment_invite_form',
          language: {
            code: 'en_US',
          },
          components: [
            {
              type: 'body',
              parameters: [
                {
                  type: 'text',
                  text: academyName, // {{1}} → student name
                },
              ],
            },
            {
              type: 'button',
              sub_type: 'url',
              index: 0,
              parameters: [
                {
                  type: 'text',
                  text: enrollmentToken, // {{1}} → enrollment token
                },
              ],
            },
          ],
        },
      };

      
      const res = await axios.post(url, payload, {
        headers: {
          Authorization: `Bearer ${this.ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });

      this.logger.log(`✅ WhatsApp message sent to ${phone}`);
      return res.data;

    } catch (error: any) {
      this.logger.error(
        '❌ WhatsApp send failed',
        error?.response?.data || error.message,
      );
      throw error;
    }
  }
}
