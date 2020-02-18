import { Controller, Get, Post, Body } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { OmnivoreService } from '../services';
import { Location } from '../entity';

const PaymentToken = require('apple-pay-decrypt')

@Controller('applepay')
export class ApplePayController {
  constructor(public omnivoreService: OmnivoreService) { }

  @Post()
  async helloWorld(@Body() body: any) {
    const applePayToken = body.applePayTransaction;
    console.log('pre buffer apppaytoken', applePayToken);

    const data = applePayToken.paymentData;
    const buff = new Buffer(data, 'base64');
    const text = JSON.parse(buff.toString('ascii'));
    console.log('apppaytoken', text);
    const certPem = fs.readFileSync(path.join(__dirname, '../../CSRs/certPem.pem'), 'utf8');
    const privatePem = fs.readFileSync(path.join(__dirname, '../../CSRs/privatePem.pem'), 'utf8');
    const token = new PaymentToken(text);
    const decrypted = token.decrypt(certPem, privatePem);
    console.log('DECRYPT', decrypted);
    const onlinePaymentCryptogram = new Buffer(decrypted.paymentData.onlinePaymentCryptogram, 'base64');

    const pan = decrypted.applicationPrimaryAccountNumber;
    const year = '20' + decrypted.applicationExpirationDate.substring(0, 2);
    const month = decrypted.applicationExpirationDate.substring(2, 4);

    console.log('base64', buff.toString('ascii'))
    const json = await this.omnivoreService.submitPayment({ omnivore_id: 'cx9pap8i'} as Location, '20200216125', pan, year, month);
    console.log(JSON.stringify(json, null, 4));
    return decrypted;
  }
}