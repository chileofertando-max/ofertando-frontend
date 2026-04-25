import {
  WebpayPlus,
  Options,
  IntegrationApiKeys,
  Environment,
  IntegrationCommerceCodes,
} from "transbank-sdk";

const commerceCode =
  process.env.TRANSBANK_COMMERCE_CODE || IntegrationCommerceCodes.WEBPAY_PLUS;
const apiKey = process.env.TRANSBANK_API_KEY || IntegrationApiKeys.WEBPAY;
const environment =
  process.env.TRANSBANK_ENVIRONMENT === "production"
    ? Environment.Production
    : Environment.Integration;

export const webpay = new WebpayPlus.Transaction(
  new Options(commerceCode, apiKey, environment),
);
