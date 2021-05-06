import axios, {
  AxiosInstance, AxiosRequestConfig, AxiosResponse, ResponseType,
} from 'axios';
import * as stream from 'stream';
import { promisify } from 'util';
import fs from 'fs';
import { BaseProvider, Provider } from '../../Provider';
import { BankOfItalyNS } from './BankOfItalyNS';
// aliases
import Options = BankOfItalyNS.Options;
import MediaType = BankOfItalyNS.MediaType;
import BaseRequestParams = BankOfItalyNS.BaseRequestParams;
import LatestRates = BankOfItalyNS.LatestRates
import Lang = BankOfItalyNS.Lang;
import Currencies = BankOfItalyNS.Currencies;
import Currency = BankOfItalyNS.Currency;
import DailyRatesRequestParams = BankOfItalyNS.DailyRatesRequestParams;

const finished = promisify(stream.finished);

/**
 * Main class which consumes Bank Of Italy Exchanges Rates API
 */
export default class BankOfItaly extends BaseProvider implements Provider {
    name: string;

    baseEndpoint: string;

    options: Options;

    request: AxiosInstance;

    /**
     * Creates an instance of BankOfItaly
     * @param options The option that can be overridden.
     */
    constructor(options?: Options) {
      super();

      this.name = 'BankOfItaly';
      this.baseEndpoint = 'https://tassidicambio.bancaditalia.it/terzevalute-wf-web/rest/v1.0';

      this.options = {
        lang: 'en',
        output: MediaType.JSON,
        requestTimeout: 3000,
        ...options,
      };

      this.request = axios.create({
        baseURL: this.baseEndpoint,
        timeout: this.options.requestTimeout,
        headers: { Accept: this.options.output },
      });
    }

    /**
     * This class' name.
     * @returns The name of this class
     */
    toString(): string {
      return this.name;
    }

    private buildQueryString<T extends BaseRequestParams>(params?: T): string {
      let qs: string = '';
      const finalLang = params?.lang || this.options.lang;

      if (params) {
        if ('referenceDate' in params) {
          const fields = (params as unknown as DailyRatesRequestParams);
          qs = `referenceDate=${fields.referenceDate}`;

          fields.baseCurrencyIsoCodes.forEach((curIsoCode) => {
            
          })
        }
      }

      // base case
      if (qs.length !== 0) {
        qs += '&';
      }

      qs += `lang=${finalLang}`;

      return qs;
    }

    /**
     * Used to correctly setup the headers and the response type.
     * @param output Specifies the Accept header
     * @returns The ready to-be-used config for Axios requests
     */
    private getAxiosConfig(output?: MediaType): AxiosRequestConfig {
      let responseType: ResponseType = 'json';
      const finalOutput = output || this.options.output;

      switch (finalOutput) {
        case MediaType.JSON:
          responseType = 'json';
          break;
        case MediaType.CSV:
        case MediaType.PDF:
        case MediaType.XLS:
          responseType = 'stream';
          break;
        default: throw new Error(`Format ${output} unsupported`);
      }

      return {
        headers: { Accept: output || this.options.output },
        responseType,
      };
    }

    /**
     * It provides the exchange rates, against the euro and the US dollar, on the latest day for
     * which there are quotations available for all the currencies quoted in the database.
     *
     * @param lang "en" or "it"
     * @param output It could be "JSON", "CSV", etc
     * @path path The path for saving the file
     * @returns The latest rates
     */
    async latestRates(params?: BaseRequestParams): Promise<LatestRates | void> {
      const axiosConf = this.getAxiosConfig(params?.output);
      const response: AxiosResponse<LatestRates | stream> = await this.request.get(
        `/latestRates?${this.buildQueryString(params)}`,
        axiosConf,
      );

      if (axiosConf.responseType === 'stream') {
        if (typeof params?.path === 'string') {
          const writer = fs.createWriteStream(params.path);
          (response.data as stream).pipe(writer);
          return finished(writer);
        }

        throw new Error('You must specify the filename for CSV, XLS and PDF');
      }

      const { resultsInfo, latestRates } = response.data as LatestRates;

      return {
        resultsInfo,
        latestRates: latestRates.map((rate) => ({
          ...rate,
          eurRate: parseFloat(rate.eurRate as unknown as string),
          usdRate: parseFloat(rate.eurRate as unknown as string),
        })),
      };
    }

    async dailyRates(params: DailyRatesRequestParams) {
      const axiosConf = this.getAxiosConfig(params.output);




    }

    /**
     * Returns a list of all currencies, including expired currencies.
     * @param lang "en" or "it"
     * @returns A list of currencies
     */
    async currencies(lang?: Lang) {
      const finalLang = lang || this.options.lang;
      const response: AxiosResponse<Currencies> = await this.request.get(`/currencies?lang=${finalLang}`, {
        headers: { Accept: MediaType.JSON }, // accept only JSON as result
      });
      return response.data;
    }

    /**
     * Calls the "currencies" method and returns a single object whose keys are the
     * currencies' ISO codes and the values are their names in the specified language.
     * It also filters out those currencies which are not valid anymore.
     * @param lang "en" or "it"
     * @returns List of simplified currencies.
     */
    async simplifiedCurrencies(lang?: Lang): Promise<Record<string, string>> {
      const response = await this.currencies(lang);

      return response.currencies
        .filter((currency: Currency) => {
          const { countries } = currency;
          return (countries.some((country) => country.validityEndDate === null));
        }).reduce((
          accumulator: Record<string, string>,
          currentValue: Currency,
        ) => {
          accumulator[currentValue.isoCode] = currentValue.name;
          return accumulator;
        }, {});
    }
}
