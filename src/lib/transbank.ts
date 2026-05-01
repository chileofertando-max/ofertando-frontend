import {
  WebpayPlus,
  Options,
  Environment,
  IntegrationApiKeys,
  IntegrationCommerceCodes,
} from "transbank-sdk";

const transbankEnv = process.env.TRANSBANK_ENV || "integration";

const commerceCode =
  process.env.TRANSBANK_COMMERCE_CODE ||
  IntegrationCommerceCodes.WEBPAY_PLUS;

const apiKey =
  process.env.TRANSBANK_API_KEY ||
  IntegrationApiKeys.WEBPAY;

const environment =
  transbankEnv === "production"
    ? Environment.Production
    : Environment.Integration;

if (transbankEnv === "production") {
  if (!process.env.TRANSBANK_COMMERCE_CODE) {
    throw new Error("Falta TRANSBANK_COMMERCE_CODE en producción");
  }

  if (!process.env.TRANSBANK_API_KEY) {
    throw new Error("Falta TRANSBANK_API_KEY en producción");
  }
}

export const webpay = new WebpayPlus.Transaction(
  new Options(commerceCode, apiKey, environment),
);
