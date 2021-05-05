<p align="center">
  <a href="https://github.com/chrisvoo/exr/blob/master/LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="EXR is released under the MIT license." />
  </a>
  <a href="https://travis-ci.com/chrisvoo/exr">
    <img src="https://travis-ci.com/chrisvoo/exr.svg?branch=main" alt="Build status" />
  </a>
</p>

<h1 align="center">EXR 0.2.0</h1>
<p align="center">💶 Exchange rates module and CLI app 💵</p>

## Table of Contents

- [Table of Contents](#table-of-contents)
- [Getting Started](#getting-started)
  - [Bank of Italy's API](#bank-of-italys-api)


## Getting Started

This is a Typescript module which aims to be used both as an importable module and as a CLI app. The types are already provided by this module.

```bash
npm i exr (not published yet)
```

The code is structured to support multiple exchange rates providers, but currently just supports [Bank of Italy's API](https://tassidicambio.bancaditalia.it/terzevalute-wf-ui-web/).

### Bank of Italy's API

This is an example for getting the exchange rates, against the euro and the US dollar, on the latest day for which there are quotations available for all the currencies quoted in the database:

```typescript
import { BankOfItaly, BankOfItalyNS } from 'exr';
import LatestRates = BankOfItalyNS.LatestRates

const bankApi = new BankOfItaly();
const rates = await bankApi.latestRates() as LatestRates;
```

`rates` will contain something like the following:

```json
{
  "resultsInfo": {
    "totalRecords": 2,
    "timezoneReference": "Dates refer to the Central European Time Zone",
    "notice": "Foreign currency amount for 1 euro "
  },
  "latestRates": [
    {
      "country": "ALBANIA",
      "currency": "Lek",
      "isoCode": "ALL",
      "uicCode": "047",
      "eurRate": "0.0089",
      "usdRate": "0.0089",
      "usdExchangeConvention": "Foreign currency amount for 1 dollar",
      "usdExchangeConventionCode": "C",
      "referenceDate": "2017-09-06"
    },
    {
      "country": "ALGERIA",
      "currency": "Algerian Dinar",
      "isoCode": "DZD",
      "uicCode": "106",
      "eurRate": "1.0000",
      "usdRate": "1.0000",
      "usdExchangeConvention": "Foreign currency amount for 1 dollar",
      "usdExchangeConventionCode": "C",
      "referenceDate": "2017-09-06"
    }
  ]
}
```

It's also possible to get the same results in other formats like PDF, CSV and Excel. In these cases, you have to pass some parameters to the methods, for example:

```typescript
import { BankOfItaly, BankOfItalyNS } from 'exr';
import MediaType = BankOfItalyNS.MediaType;

const bankApi = new BankOfItaly();
const path = './latestRates.pdf';
await bankApi.latestRates(
    MediaType.PDF,
    './latestRates.pdf',
);
```

Whenever you export the result in something different than JSON, all the promises won't return anything and you'll find the file at the specified path.  
In case you need a list of all the currencies currently used in the world, you just have to call `bankApi.simplifiedCurrencies()`. The method will return a `Record<string, string>` whose keys are the currencies ISO codes, and the values their name.

```javascript
{
  //...
  "EUR": "Euro",
  "FJD": "Fiji Dollar",
  "FKP": "Falkland Pound",
  "GBP": "Pound Sterling",
  //...
}
```

A cached JSON object reporting the same information [can be found here](docs/currencies.json).  
Please [refer to the full documentation](./docs/Operating_Instructions.pdf) to see the corresponding methods and their parameters.