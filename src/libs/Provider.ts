/* eslint-disable class-methods-use-this */
import { AxiosInstance, AxiosResponse } from 'axios';
import fs from 'fs';

export interface Provider {
    name: string; // name of the class implementing this interface
    baseEndpoint: string; // base endpoint for all requests
    request: AxiosInstance;
}

/**
 * Methods to be inherited by all providers.
 */
export abstract class BaseProvider {
  /**
   * Save JSON data to a file.
   * @param path The path where to save the JSON data.
   * @param response The JSON
   * @param prettify If to pretty print the JSON inside the file.
   * @returns An empty Promise
   */
  toJSONFile(path: fs.PathLike, data: any, prettify: boolean = true): Promise<void> {
    if (!path) {
      throw new Error('Please specify a filename');
    }

    const spaces = prettify ? 4 : undefined;

    return fs.promises.writeFile(
      path,
      JSON.stringify(data, null, spaces),
    );
  }
}
