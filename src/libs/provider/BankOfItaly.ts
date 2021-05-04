import axios, {
  AxiosInstance, AxiosRequestConfig, AxiosResponse, ResponseType,
} from 'axios';
import * as stream from 'stream';
import { promisify } from 'util';
import fs from 'fs';
import { BaseProvider, Provider } from '../Provider';
import { BankOfItalyNS } from './BankOfItalyNS';

const finished = promisify(stream.finished);

/**
 * Main class which consumes Bank Of Italy Exchanges Rates API
 */
export default class BankOfItaly extends BaseProvider implements Provider {
    name: string;

    baseEndpoint: string;

    options: BankOfItalyNS.Options;

    request: AxiosInstance;

    /**
     * Creates an instance of BankOfItaly
     * @param options The option that can be overridden.
     */
    constructor(options?: BankOfItalyNS.Options) {
      super();

      this.name = 'BankOfItaly';
      this.baseEndpoint = 'https://tassidicambio.bancaditalia.it/terzevalute-wf-web/rest/v1.0';

      this.options = {
        lang: 'en',
        output: BankOfItalyNS.MediaType.JSON,
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

    /**
     * Used to correctly setup the headers and the response type.
     * @param output Specifies the Accept header
     * @returns The ready to-be-used config for Axios requests
     */
    private getAxiosConfig(output?: BankOfItalyNS.MediaType): AxiosRequestConfig {
      let responseType: ResponseType = 'json';
      const finalOutput = output || this.options.output;

      switch (finalOutput) {
        case BankOfItalyNS.MediaType.JSON:
          responseType = 'json';
          break;
        case BankOfItalyNS.MediaType.CSV:
        case BankOfItalyNS.MediaType.PDF:
        case BankOfItalyNS.MediaType.XLS:
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
    async latestRates(
      output?: BankOfItalyNS.MediaType,
      path?: string,
      lang?: BankOfItalyNS.Lang,
    ): Promise<BankOfItalyNS.LatestRates | void> {
      const finalLang = lang || this.options.lang;

      const axiosConf = this.getAxiosConfig(output);
      const response: AxiosResponse<BankOfItalyNS.LatestRates | stream> = await this.request.get(
        `/latestRates?lang=${finalLang}`,
        axiosConf,
      );

      if (axiosConf.responseType === 'stream') {
        if (typeof path === 'string') {
          const writer = fs.createWriteStream(path);
          (response.data as stream).pipe(writer);
          return finished(writer);
        }

        throw new Error('You must specify the filename for CSV, XLS and PDF');
      }

      const { resultsInfo, latestRates } = response.data as BankOfItalyNS.LatestRates;

      return {
        resultsInfo,
        latestRates: latestRates.map((rate) => ({
          ...rate,
          eurRate: parseFloat(rate.eurRate as unknown as string),
          usdRate: parseFloat(rate.eurRate as unknown as string),
        })),
      };
    }

    /**
     * Returns a list of all currencies, including expired currencies.
     * @param lang "en" or "it"
     * @returns A list of currencies
     */
    async currencies(lang?: BankOfItalyNS.Lang) {
      const finalLang = lang || this.options.lang;
      const response: AxiosResponse<BankOfItalyNS.Currencies> = await this.request.get(`/currencies?lang=${finalLang}`, {
        headers: { Accept: BankOfItalyNS.MediaType.JSON }, // accept only JSON as result
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
    async simplifiedCurrencies(lang?: BankOfItalyNS.Lang): Promise<Record<string, string>> {
      const response = await this.currencies(lang);

      return response.currencies
        .filter((currency: BankOfItalyNS.Currency) => {
          const { countries } = currency;
          return (countries.some((country) => country.validityEndDate === null));
        }).reduce((
          accumulator: Record<string, string>,
          currentValue: BankOfItalyNS.Currency,
        ) => {
          accumulator[currentValue.isoCode] = currentValue.name;
          return accumulator;
        }, {});
    }
}
