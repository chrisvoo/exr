import 'jest-extended';
import {
  OptionValidator,
  BaseRequestParamsValidator,
  DailyRatesRequestParamsValidator,
} from '../../src/libs/provider/BankOfItaly/BankOfItalyValidators';
import { BankOfItalyNS } from '../../src/libs/provider/BankOfItaly/BankOfItalyNS';
import MediaType = BankOfItalyNS.MediaType;

describe('Validators', () => {
  describe('Options', () => {
    it('should not allow foreign fields', () => {
      const { error } = OptionValidator.validate({ a: 1 });
      expect(error).not.toBeUndefined();
      expect(error!.message).toBe('"a" is not allowed');
    });

    it('can fill the default values', () => {
      const { value, error } = OptionValidator.validate({});
      expect(error).toBeUndefined();
      expect(value).toContainAllEntries([
        ['lang', 'en'],
        ['output', MediaType.JSON],
        ['requestTimeout', 3000],
      ]);
    });

    it('can validate the positivity of a number', () => {
      const { error } = OptionValidator.validate({
        lang: 'en',
        output: MediaType.JSON,
        requestTimeout: -3,
      });
      expect(error).not.toBeUndefined();
      expect(error!.message).toBe('"requestTimeout" must be a positive number');
    });
  });

  describe('BaseRequestParamsValidator', () => {
    it('should not allow foreign fields', () => {
      const { error } = BaseRequestParamsValidator.validate({ a: 1 });
      expect(error).not.toBeUndefined();
      expect(error!.message).toBe('"a" is not allowed');
    });

    it('can detect a missing param if another one is included', () => {
      const { error } = BaseRequestParamsValidator.validate({
        lang: 'en',
        output: MediaType.CSV,
      });
      expect(error).not.toBeUndefined();
      expect(error!.message).toBe('"path" is required');
    });

    it('can fill the default values', () => {
      const { value } = BaseRequestParamsValidator.validate({});
      expect(value).toContainAllEntries([
        ['lang', 'en'],
        ['output', MediaType.JSON],
      ]);
    });

    it('can recognize a valid object', () => {
      const { value } = BaseRequestParamsValidator.validate({
        lang: 'en',
        output: MediaType.PDF,
        path: '/tmp/rates.pdf',
      });
      expect(value).toContainAllEntries([
        ['lang', 'en'],
        ['output', MediaType.PDF],
        ['path', '/tmp/rates.pdf'],
      ]);
    });
  });

  describe('DailyRatesRequestParamsValidator', () => {
    it('can detect a missing required param', () => {
      const { error } = DailyRatesRequestParamsValidator.validate({ a: 1 });
      expect(error).not.toBeUndefined();
      expect(error!.message).toBe('"referenceDate" is required');
    });

    it('can detect a missing param if another one is included', () => {
      const { error } = DailyRatesRequestParamsValidator.validate({
        lang: 'en',
        output: MediaType.CSV,
      });
      expect(error).not.toBeUndefined();
      expect(error!.message).toBe('"path" is required');
    });

    it('can detect wrong dates', () => {
      let { error } = DailyRatesRequestParamsValidator.validate({
        referenceDate: '2020-10-am',
        baseCurrencyIsoCodes: 'EUR',
        currencyIsoCode: 'USD',
      });
      expect(error).not.toBeUndefined();
      expect(error!.message).toBe('"referenceDate" contains an invalid value');

      ({ error } = DailyRatesRequestParamsValidator.validate({
        referenceDate: '2020-10-51',
        baseCurrencyIsoCodes: 'EUR',
        currencyIsoCode: 'USD',
      }));
      expect(error).not.toBeUndefined();
      expect(error!.message).toBe('"referenceDate" contains an invalid value');

      ({ error } = DailyRatesRequestParamsValidator.validate({
        referenceDate: 2021,
        baseCurrencyIsoCodes: 'EUR',
        currencyIsoCode: 'USD',
      }));
      expect(error).not.toBeUndefined();
      expect(error!.message).toBe('"referenceDate" must be a string');
    });


    it('can recognize a valid object', () => {
      const result = DailyRatesRequestParamsValidator.validate({
        referenceDate: '2020-10-22',
        baseCurrencyIsoCodes: 'EUR',
        currencyIsoCode: 'USD',
        lang: 'en',
      });

      expect(result.value).toContainAllEntries([
        ['lang', 'en'],
        ['output', MediaType.JSON],
        ['baseCurrencyIsoCodes', 'EUR'],
        ['currencyIsoCode', 'USD'],
        ['referenceDate', '2020-10-22'],
      ]);
    });
  });
});
