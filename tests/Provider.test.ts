import BankOfItaly from '../src/libs/provider/BankOfItaly/BankOfItaly';
import 'jest-extended';

describe('Provider tests', () => {
  it('can list the filtered currencies', () => {
    const bankApi = new BankOfItaly();
    const currencies = bankApi.filterCurrencies('E');
    const match = ['EGP', 'ERN', 'ETB', 'EUR'];
    expect(currencies).toIncludeSameMembers(match);
  });
});
