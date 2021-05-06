/* eslint-disable max-len */
/* eslint-disable indent */
import Joi from 'joi';
import { BankOfItalyNS } from './BankOfItalyNS';
import currencies from '../../../data/currencies.json';

import Options = BankOfItalyNS.Options;
import MediaType = BankOfItalyNS.MediaType;
import BaseRequestParams = BankOfItalyNS.BaseRequestParams;
import DailyRatesRequestParams = BankOfItalyNS.DailyRatesRequestParams;

export const OptionValidator: Joi.ObjectSchema<Options> = Joi.object({
  lang: Joi.string()
           .allow('en', 'it')
           .insensitive()
           .default('en'),
  output: Joi.string()
             .allow(Object.values(MediaType).join(','))
             .default(MediaType.JSON),
  requestTimeout: Joi.number()
                     .integer()
                     .positive()
                     .default(3000),
});

export const BaseRequestParamsValidator: Joi.ObjectSchema<BaseRequestParams | DailyRatesRequestParams> = Joi.object({
  lang: Joi.string()
           .allow('en', 'it')
           .insensitive()
           .default('en'),
  output: Joi.string()
              .allow(Object.values(MediaType).join(','))
              .default(MediaType.JSON),
  path: Joi.when('output', {
    not: MediaType.JSON,
    then: Joi.string().required(),
    otherwise: Joi.string(),
  }),
});

// eslint-disable-next-line max-len
export const DailyRatesRequestParamsValidator: Joi.ObjectSchema<DailyRatesRequestParams> = BaseRequestParamsValidator.keys({
  referenceDate: Joi.string()
                    .required()
                    .pattern(new RegExp(/(\d){4}-(\d){2}-(\d){2}/)),
  baseCurrencyIsoCodes: Joi.string()
                           .allow(Object.keys(currencies).join(','))
                           .required(),
});
