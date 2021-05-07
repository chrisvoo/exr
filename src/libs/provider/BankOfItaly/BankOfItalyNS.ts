import currencies from '../../../data/currencies.json';

/**
 * Main namespace for Bank Of Italy's API.
 * All dates are represented in the format "YYYY-MM-DD".
 * All response interfaces extends Response interface
 */
export namespace BankOfItalyNS {
    /**
     * Available languages for messages
     */
    export type Lang = 'en' | 'it';

    export enum MediaType {
        JSON = 'application/json',
        PDF = 'application/pdf',
        CSV = 'text/csv',
        XLS = 'application/vnd.ms-excel'
    }

    export type Options = {
        lang: Lang
        output: MediaType
        requestTimeout: number
    }

    export interface ResultsInfo {
        totalRecords: number,
        timezoneReference: string
        notice?: string
    }

    export interface BaseRate {
        country: string
        currency: string
        isoCode: string
        uicCode: string
    }

    export interface LatestRate extends BaseRate {
        eurRate: number
        usdRate: number
        usdExchangeConvention: string
        usdExchangeConventionCode: string
        referenceDate: string
    }

    export interface DailyRate extends BaseRate {
        avgRate: number
        exchangeConvention: string
        exchangeConventionCode: string
        referenceDate: string
    }

    export interface BaseRequestParams {
        lang?: Lang
        output?: MediaType
        path?: string
    }

    export interface DailyRatesRequestParams extends BaseRequestParams {
        /** Quotation date. */
        referenceDate: string // Format: YYYY-MM-DD
        /** The ISO code for the currency for which you want the exchange rate (case
insensitive). */
        baseCurrencyIsoCodes: Array<keyof typeof currencies>
        /** The currency ISO code (case insensitive) against which you want the rates.
 */
        currencyIsoCode: 'EUR' | 'USD' | 'ITL',
    }

    export interface Response {
        resultsInfo: ResultsInfo
    }

    export interface LatestRates extends Response {
        latestRates: LatestRate[]
    }
    export interface DailyRates extends Response {
        rates: DailyRate[]
    }

    export interface Country {
        currencyISO: string
        country: string
        countryISO: string
        validityStartDate: string
        validityEndDate: string
    }

    export interface Currency {
        countries: Country[]
        isoCode: string
        name: string
        graph: boolean
    }

    export interface Currencies extends Response {
        currencies: Currency[]
    }
}
