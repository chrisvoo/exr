import axios, {
  AxiosInstance, AxiosRequestConfig, AxiosResponse, ResponseType,
} from 'axios';
import qs from 'querystring';
import * as stream from 'stream';
import { promisify } from 'util';
import fs from 'fs';
import { BaseProvider, Provider } from '../../Provider';
import { BankOfItalyNS } from './BankOfItalyNS';
import {
  BaseRequestParamsValidator,
  DailyRatesRequestParamsValidator,
  OptionValidator,
} from './BankOfItalyValidators';

// aliases
import Options = BankOfItalyNS.Options;
import MediaType = BankOfItalyNS.MediaType;
import BaseRequestParams = BankOfItalyNS.BaseRequestParams;
import LatestRates = BankOfItalyNS.LatestRates
import Lang = BankOfItalyNS.Lang;
import Currencies = BankOfItalyNS.Currencies;
import Currency = BankOfItalyNS.Currency;
import DailyRatesRequestParams = BankOfItalyNS.DailyRatesRequestParams;
import DailyRate = BankOfItalyNS.DailyRate;
import DailyRates = BankOfItalyNS.DailyRates;

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

      const { error, value } = OptionValidator.validate(options || {});
      if (error) {
        throw new Error(error.message);
      }

      this.options = value as Options;

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

    /**
     * This method builds the query string. Remember to validate everything before
     * calling this method, 'cause it makes these assumptions
     * @param params A request params object
     * @returns {string} The query string
     */
    private buildQueryString<T extends BaseRequestParams>(params?: T): string {
      let finalQueryString: any = {};

      if (params) {
        if ('referenceDate' in params) {
          // we assume it's a valid DailyRatesRequestParams
          const fields = (params as unknown as DailyRatesRequestParams);
          finalQueryString = { ...params };
          // these params are just internally useful, they must not be part
          // of the final query string
          if (params?.output) {
            delete finalQueryString.output;
          }

          if (params?.path) {
            delete finalQueryString.path;
          }
        }
      }

      const finalLang = params?.lang || this.options.lang;
      finalQueryString.lang = finalLang;

      return qs.stringify(finalQueryString);
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
      const { error, value } = BaseRequestParamsValidator.validate(params || {});
      if (error) {
        throw new Error(error.message);
      }

      const valueParams = value as BaseRequestParams;

      const axiosConf = this.getAxiosConfig(valueParams?.output);
      const response: AxiosResponse<LatestRates | stream> = await this.request.get(
        `/latestRates?${this.buildQueryString(valueParams)}`,
        axiosConf,
      );

      if (axiosConf.responseType === 'stream') {
        if (typeof valueParams?.path === 'string') {
          const writer = fs.createWriteStream(valueParams.path);
          (response.data as stream).pipe(writer);
          return finished(writer);
        }

        // this should never happen, since the validator takes this into account
        throw new Error('You must specify the path param for CSV, XLS and PDF');
      }

      const { resultsInfo, latestRates } = response.data as LatestRates;

      return {
        resultsInfo,
        latestRates: latestRates.map(rate => ({
          ...rate,
          eurRate: parseFloat(rate.eurRate as unknown as string),
          usdRate: parseFloat(rate.eurRate as unknown as string),
        })),
      };
    }

    /**
     * It provides daily exchange rates for a specific date, against the euro, the US
     * dollar or the Italian lira, for one or more requested currencies, which are valid
     * and for which the rates for the selected date are available.
     * If no currency is specified, the service will return all the available currencies.
     * If there are no quotations for the date and currencies selected, the service
     * will return an empty list with an information message.
     * @param params Request parameters
     * @returns The daily rates response.
     */
    async dailyRates(params: DailyRatesRequestParams): Promise<DailyRates | void> {
      const { error, value } = DailyRatesRequestParamsValidator.validate(params);
      if (error) {
        throw new Error(error.message);
      }

      const valueParams = value as DailyRatesRequestParams;
      const axiosConf = this.getAxiosConfig(valueParams.output);

      const response: AxiosResponse<DailyRates | stream> = await this.request.get(
        `/dailyRates?${this.buildQueryString(valueParams)}`,
        axiosConf,
      );

      const { resultsInfo, rates } = response.data as DailyRates;

      return {
        resultsInfo,
        rates: rates.map(rate => ({
          ...rate,
          avgRate: parseFloat(rate.avgRate as unknown as string),
        })),
      };
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
          return (countries.some(country => country.validityEndDate === null));
        }).reduce((
          accumulator: Record<string, string>,
          currentValue: Currency,
        ) => {
          // eslint-disable-next-line no-param-reassign
          accumulator[currentValue.isoCode] = currentValue.name;
          return accumulator;
        }, {});
    }
}
