import {TestRequestConfig, TestRequests, TestResponses} from '../../types/test-requests';
import * as assert from 'assert';
import {AxiosInstance, AxiosRequestConfig, AxiosResponse} from 'axios';
import * as path from 'path';

import {PROXY_PORT, TARGET_SERVER_PORT} from '../config';
import {runProxy as runProxyApp} from '../../src/app';
import {closeServer} from '../../src/util';
import {readDirFilesSync} from './io';
import {withServers} from './server';
import * as chalk from 'chalk';

/**
 * Formats a request in a compact way, i.e. METHOD /url {...}
 * Example:
 *     POST /echo {"input":"Marco!"}
 */
export function formatRequest(req: AxiosRequestConfig): string {
  const s = `${req.method} ${req.url}`;
  if (typeof req.data !== 'undefined') {
    const data =
      typeof req.data === 'string' ? req.data : JSON.stringify(req.data);
    return s + ' ' + data;
  } else {
    return s;
  }
}

export async function assertThrowsAsync(fn: () => Promise<void>, regExp: RegExp): Promise<void> {
  let f = () => { return };
  try {
    await fn();
  } catch (e) {
    f = () => {
      throw e;
    };
  } finally {
    assert.throws(f, regExp);
  }
}

/**
 * For each OpenAPI file in a given directory, it boots a proxy and a mock
 * server and runs the provided test requests. It then executes the callback
 * function that contains the test code.
 */
export function testRequestForEachFile({
  testTitle,
  dir,
  testRequests,
  client,
  callback,
  defaultForbidAdditionalProperties = false,
  silent = false,
}: {
  testTitle: string;
  dir: string;
  testRequests: TestRequests;
  client: { proxy: AxiosInstance; target: AxiosInstance };
  callback: (
    proxyRes: AxiosResponse,
    targetRes: AxiosResponse,
    fileName: string,
    requestObject: TestRequestConfig,
  ) => void;
  defaultForbidAdditionalProperties?: boolean;
  silent?: boolean;
}): void {
  // tslint:disable:only-arrow-functions
  for (const p of readDirFilesSync(dir)) {
    const fileName = path.normalize(path.basename(p)).replace(/\\/g, '/');
    it(`${testTitle}: ${fileName}`, async function() {
      // Skip if no test requests exist for the OpenAPI definition
      if (!(fileName in testRequests)) {
        console.log(
          chalk.keyword('orange')(
            `Skipping '${fileName}' due to missing test requests.`,
          ),
        );
        return;
      }

      await withServers({
        apiDocPath: p,
        defaultForbidAdditionalProperties,
        silent,
        async callback() {
          // Perform all test requests on both servers yield responses
          // to compare
          for (const req of testRequests[fileName]) {
            console.log(`Sending request ${formatRequest(req)}`);
            const targetRes = await client.target(req);
            const proxyRes = await client.proxy(req);
            callback(proxyRes, targetRes, fileName, req);
          }
        },
      });
    });
  }
}

/**
 * For each OpenAPI file in a given directory, it boots a proxy server, along
 * with a test target server and runs the provided test requests. It then
 * executes the callback function that contains the test code.
 */
export function testRequestForEachFileWithServers({
  testTitle,
  dir,
  testServers,
  client,
  callback,
  defaultForbidAdditionalProperties = false,
}: {
  testTitle: string;
  dir: string;
  testServers: TestResponses;
  client: { proxy: AxiosInstance; target: AxiosInstance };
  defaultForbidAdditionalProperties?: boolean;
  callback: (
    proxyRes: AxiosResponse,
    targetRes: AxiosResponse,
    fileName: string,
    expectedError: any,
  ) => void;
}): void {
  // tslint:disable:only-arrow-functions
  for (const apiDocFile of readDirFilesSync(dir)) {
    const fileName = path
      .normalize(path.basename(apiDocFile))
      .replace(/\\/g, '/');
    it(`${testTitle}: ${fileName}`, async function() {
      if (!(fileName in testServers)) {
        console.log(
          chalk.keyword('orange')(
            `Skipping '${fileName}' due to missing test responses.`,
          ),
        );
        return;
      }

      if (testServers[fileName].length === 0) {
        // When no tests are present in the array, this is interpreted as an
        // intentional skip
        return;
      }

      console.log('Starting proxy server...');
      const proxyServer = await runProxyApp({
        port: PROXY_PORT,
        host: 'localhost',
        targetUrl: `http://localhost:${TARGET_SERVER_PORT}`,
        apiDocPath: apiDocFile,
        defaultForbidAdditionalProperties,
      });

      console.log('Running test...');
      for (const { request, runServer, expectedError } of testServers[
        fileName
      ]) {
        console.log('Starting some mock server...');
        const mockServer = await runServer();

        console.log(`Sending request ${formatRequest(request)}`);
        const targetRes = await client.target(request);
        const proxyRes = await client.proxy(request);

        callback(proxyRes, targetRes, fileName, expectedError);

        console.log('Shutting down mock server...');
        await closeServer(mockServer);
      }

      console.log('Shutting down proxy server...');
      await closeServer(proxyServer);
    });
  }
}
