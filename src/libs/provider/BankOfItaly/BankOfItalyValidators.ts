/* eslint-disable max-len */
/* eslint-disable indent */
import Joi from 'joi';
import { BankOfItalyNS } from './BankOfItalyNS';
import currencies from '../../../data/currencies.json';

import Options = BankOfItalyNS.Options;
import MediaType = BankOfItalyNS.MediaType;
import BaseRequestParams = BankOfItalyNS.BaseRequestParams;
import DailyRatesRequestParams = BankOfItalyNS.DailyRatesRequestParams;

const lang: Joi.SchemaLike = Joi.string()
                                .allow('en', 'it')
                                .insensitive()
                                .default('en');

const output: Joi.SchemaLike = Joi.string()
                                  .allow(Object.values(MediaType).join(','))
                                  .default(MediaType.JSON);

export const OptionValidator: Joi.ObjectSchema<Options> = Joi.object({
  lang,
  output,
  requestTimeout: Joi.number()
                     .integer()
                     .positive()
                     .default(3000),
});

export const BaseRequestParamsValidator: Joi.ObjectSchema<BaseRequestParams | DailyRatesRequestParams> = Joi.object({
  lang,
  output,
  path: Joi.when('output', {
    not: MediaType.JSON,
    then: Joi.string().required(),
    otherwise: Joi.string(),
  }),
});

/**
 * Simple date evaluation for "YYYY-MM-DD" format, for more formats consider to use
 * momentjs or @joi/date (currently there's a bug that consider numbers valid dates)
 * @param value Any value
 * @param helpers Joi helpers
 * @returns the untouched value or throws an Error
 */
const tinyDateEval = (value: any, helpers: Joi.CustomHelpers) => {
  if (typeof value !== 'string') {
    throw new Error('Value must be a string');
  }

  if (new Date(value).toString() === 'Invalid Date') {
    return helpers.error('any.invalid');
  }

  return value;
};

// eslint-disable-next-line max-len
export const DailyRatesRequestParamsValidator: Joi.ObjectSchema<DailyRatesRequestParams> = BaseRequestParamsValidator.keys({
  referenceDate: Joi.string().custom(tinyDateEval, 'Validation for YYYY-MM-DD format').required(),
  baseCurrencyIsoCodes: Joi.string()
                           .allow(Object.keys(currencies).join(','))
                           .required(),

  currencyIsoCode: Joi.string().allow('EUR', 'USD', 'ITL').required(),
});
