import { Injectable } from '@nestjs/common';
import * as Twilio from 'twilio';

@Injectable()
export class SMSService {

  async sendSMS(toNum: string, textMsg: string) {
    // Using Twilio for text messages
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const client = new (Twilio as any)(accountSid, authToken);

    const textContent = {
      body: textMsg,
      from: process.env.TWILIO_FROM_NUM,
      to: toNum,
    };

    const sms = await client.messages.create(textContent);
    console.log(sms);
  }
}