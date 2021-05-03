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

    export interface Rate {
        country: string
        currency: string
        isoCode: string
        uicCode: string
        eurRate: number
        usdRate: number
        usdExchangeConvention: string
        usdExchangeConventionCode: string
        referenceDate: string
    }

    export interface Response {
        resultsInfo: ResultsInfo
    }

    export interface LatestRates extends Response {
        latestRates: Rate[]
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
