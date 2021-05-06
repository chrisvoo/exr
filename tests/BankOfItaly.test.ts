import fs from 'fs';
import BankOfItaly from '../src/libs/provider/BankOfItaly/BankOfItaly';
import { BankOfItalyNS } from '../src/libs/provider/BankOfItaly/BankOfItalyNS';
import { OptionValidator } from '../src/libs/provider/BankOfItaly/BankOfItalyValidators';
import { showResult } from '../src/cli/terminal';
import 'jest-extended';

// aliases
import MediaType = BankOfItalyNS.MediaType;
import LatestRates = BankOfItalyNS.LatestRates

describe('Bank Of Italy API tests', () => {
  it('has the default props correctly setup', () => {
    const bankApi = new BankOfItaly();

    expect(bankApi.name).toBe('BankOfItaly');
    expect(bankApi.options.requestTimeout).toBe(3000);
    expect(bankApi.options.lang).toBe('en');
    expect(bankApi.options.output).toBe(MediaType.JSON);
  });

  it('can call latestRates returning a JSON response', async () => {
    const bankApi = new BankOfItaly();
    const rates = await bankApi.latestRates() as LatestRates;

    expect(rates).not.toBeNull();
    expect(rates.resultsInfo.totalRecords).toBeGreaterThan(1);
    expect(Array.isArray(rates.latestRates)).toBeTruthy();
    // showResult(rates);
  });

  it('can call latestRates returning a PDF response', async (done) => {
    const bankApi = new BankOfItaly();
    const path = './latestRates.pdf';
    await bankApi.latestRates({
      output: MediaType.PDF,
      path: './latestRates.pdf',
    });

    fs.access(path, fs.constants.F_OK, (err) => {
      if (err) {
        throw new Error('File does not exist');
      }

      fs.unlink(path, (err) => {
        done();
      });
    });
  });

  it('can call currencies and save it to a JSON file', async (done) => {
    const bankApi = new BankOfItaly();
    const path = './currencies.json';
    const response = await bankApi.currencies();

    expect(response.resultsInfo.totalRecords).toBeGreaterThan(174);

    const currency = response.currencies.filter((currency) => currency.name === 'Italian Lira');
    const theCountry = currency[0].countries[0];
    expect(theCountry.country).toBe('ITALY');
    expect(theCountry.validityEndDate).toBe('2001-12-28');
    expect(currency[0].name).toBe('Italian Lira');

    await bankApi.toJSONFile(path, response, true);

    fs.access(path, fs.constants.F_OK, (err) => {
      if (err) {
        throw new Error('File does not exist');
      }

      fs.unlink(path, (err) => {
        done();
      });
    });
  }, 10000);

  it('can call simplifiedCurrencies to obtain a simplified currencies object', async () => {
    const bankApi = new BankOfItaly();
    const response = await bankApi.simplifiedCurrencies();
    expect(Object.prototype.hasOwnProperty.call(response, 'EUR')).toBeTruthy();
    // showResult(response);
  });

  it.only('can validate constructor options', () => {
    let { error } = OptionValidator.validate({ a: 1 });
    expect(error).not.toBeUndefined();
    expect(error!.message).toBe('"a" is not allowed');

    ({ error } = OptionValidator.validate({
      lang: 'en',
      output: MediaType.JSON,
      requestTimeout: -3,
    }));
    expect(error).not.toBeUndefined();
    expect(error!.message).toBe('"requestTimeout" must be a positive number');

    const { value } = OptionValidator.validate({});
    expect(value).toContainAllEntries([
      ['lang', 'en'],
      ['output', MediaType.JSON],
      ['requestTimeout', 3000],
    ]);
  });
});
