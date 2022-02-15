const debug = require('debug')('openapi-cop:proxy');
debug.log = console.log.bind(console); // output to stdout
import chalk = require('chalk');
import * as express from 'express';
import { NextFunction, Request, Response } from 'express';
import * as http from 'http';
import { Operation } from 'openapi-backend';
import * as path from 'path';
import * as crypto from 'crypto';
import * as validUrl from 'valid-url';
import * as rp from 'request-promise-native';
import { ValidationResults } from '../types/validation';
import {
  convertToOpenApiV3,
  copyHeaders,
  mapWalkObject,
  parseResponseBody,
  readFileSync,
  setSourceRequestHeader,
  setValidationHeader,
  toOasRequest,
  fetchAndReadFile,
} from './util';
import { dereference, hasErrors, resolve, Validator } from './validation';

interface BuildOptions {
  targetUrl: string;
  apiDocPath: string;
  defaultForbidAdditionalProperties?: boolean;
  silent?: boolean;
}

const defaults: BuildOptions = {
  targetUrl: 'http://localhost:8889',
  apiDocPath: '',
  defaultForbidAdditionalProperties: false,
  silent: false,
};

interface ProxyOptions {
  port: number;
  host: string;
  targetUrl: string;
  apiDocPath: string;
  defaultForbidAdditionalProperties?: boolean;
  silent?: boolean;
}

/**
 * Builds a new express app instance, and attaches all necessary middleware.
 */
export async function buildApp(
  options: BuildOptions,
): Promise<express.Application> {
  const { targetUrl, apiDocPath, defaultForbidAdditionalProperties, silent } = {
    ...defaults,
    ...options,
  };

  const app: express.Application = express();

  const rawApiDoc = validUrl.isWebUri(apiDocPath)
    ? await fetchAndReadFile(apiDocPath)
    : readFileSync(apiDocPath);
  
  console.log(
    chalk.blue(
      'Validating against ' +
        chalk.bold(
          `${path.basename(apiDocPath)} ("${rawApiDoc.info.title}", version: ${
            rawApiDoc.info.version
          })`,
        ),
    ),
  );

  if (defaultForbidAdditionalProperties) {
    console.log(
      chalk.keyword('orange')(
        'Additional properties will be forbidden by default. Existing `additionalProperties` settings in the OpenAPI document will NOT be overwritten.',
      ),
    );
  }

  const apiDoc = prepareApiDocument(rawApiDoc, apiDocPath, defaultForbidAdditionalProperties);

  const oasValidator: Validator = new Validator(apiDoc);

  // Consume raw request body
  app.use(express.raw({ type: '*/*' }));

  // Global route handler
  app.all('*', (req: Request, res: Response) => {
    const validationResults: ValidationResults = {};
    // Build simplified request (for OpenAPIBackend validator)
    const oasRequest = toOasRequest(req);
    // Write source request into response header
    setSourceRequestHeader(res, oasRequest);

    // Deduce OpenAPI operation
    const operation = oasValidator.matchOperation(oasRequest);

    validationResults.request = oasValidator.validateRequest(
      oasRequest,
      operation,
    );

    const options: rp.Options = {
      url: targetUrl.replace(/\/$/, '') + req.params[0],
      qs: req.query,
      method: req.method,
      headers: req.headers,
      gzip: true,
      resolveWithFullResponse: true,
      simple: false,
    };

    // Attach unmodified request body when present
    if (typeof req.body !== 'undefined' && req.body instanceof Buffer) {
      options.body = req.body;
    }

    debug(`Proxying client request [${oasRequest.method} ${oasRequest.path}]`);

    // Send request and handle response of the target server
    rp(options)
      .then((serverResponse: http.IncomingMessage & { body: string }) => {
        debug(
          `Received server response with status code ${serverResponse.statusCode}`,
        );
        const statusCode = serverResponse.statusCode || 500;

        const parsedResponseBody = parseResponseBody(serverResponse);

        validationResults.response = oasValidator.validateResponse(
          parsedResponseBody,
          operation as Operation,
          statusCode,
        );

        validationResults.responseHeaders = oasValidator.validateResponseHeaders(
          serverResponse.headers,
          operation as Operation,
          statusCode,
        );

        copyHeaders(serverResponse, res);
        setValidationHeader(res, validationResults);
        debug(
          `Validation results [${oasRequest.method} ${oasRequest.path}] ` +
            JSON.stringify(validationResults, null, 2),
        );

        if (silent || !hasErrors(validationResults)) {
          // when in silent mode, or when validation succeeded, forward the
          // unmodified server response
          res.status(statusCode).send(serverResponse.body);
        } else {
          // when not silent, render validation results on error
          res.status(500).json({
            error: {
              message: 'openapi-cop Proxy validation failed',
              request: oasRequest,
              response: serverResponse,
              validationResults,
            },
          });
        }
      })
      .catch((err: any) => {
        if (err.error && err.error.errno === 'ECONNREFUSED') {
          debug('Target server is unreachable');
        }
        if (err.response) {
          copyHeaders(err.response, res);
        }
        setValidationHeader(res, validationResults);
        debug(
          `Validation results [${oasRequest.method} ${oasRequest.path}] ` +
            JSON.stringify(validationResults, null, 2),
        );

        if (silent || !hasErrors(validationResults)) {
          res.status(err.statusCode || 500).send(err.response);
        } else {
          // when not silent, render validation results on error
          res.status(500).json({
            error: {
              message: 'openapi-cop Proxy validation failed',
              request: oasRequest,
              response: err.response,
              validationResults,
            },
          });
        }
      });
  });

  // Global error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('openapi-cop found an error (but is still alive).');
    console.error(err.stack);
    res.header('Content-Type', 'application/json');
    res.status(500).send('openapi-cop proxy server error');
  });

  return app;
}

/**
 * Builds the proxy and runs it on the given port.
 * @param proxy The port on which the proxy will run.
 * @param host The host name or IP address of the proxy server.
 * @param targetUrl The URL the proxy routes from.
 * @param apiDocFile The OpenAPI document path used to perform validation.
 * @param defaultForbidAdditionalProperties Whether additional properties are
 * allowed in requests and responses.
 * @param silent Do not respond with 500 status when validation fails, but leave
 * the server response untouched
 */
export async function runProxy({
  port,
  host,
  targetUrl,
  apiDocPath,
  defaultForbidAdditionalProperties = false,
  silent = false,
}: ProxyOptions): Promise<http.Server> {
  try {
    const app = await buildApp({
      targetUrl,
      apiDocPath,
      defaultForbidAdditionalProperties,
      silent,
    });
    let server: http.Server;
    return new Promise<http.Server>(resolve => {
      server = app.listen(port, host, () => {
        resolve(server);
      });
    });
  } catch (error) {
    console.error('Failed to run openapi-cop', error);
    return Promise.reject();
  }
}

async function prepareApiDocument(rawApiDoc: any, apiDocPath: string, defaultForbidAdditionalProperties: boolean | undefined): Promise<any> {
  const apiDocConv = await convertToOpenApiV3(rawApiDoc, apiDocPath).catch(
    err => {
      throw new Error(`Could not convert document to OpenAPI v3: ${err}`);
    },
  );

  const apiDocDeref = await dereference(apiDocConv, apiDocPath).catch(err => {
    throw new Error(`Reference resolution error: ${err}`);
  });

  let apiDoc = await resolve(apiDocDeref, apiDocPath).catch(err => {
    throw new Error(`Reference resolution error: ${err}`);
  });

  apiDoc = mapWalkObject(apiDoc, (obj, traversalPath) => {
    // In strict mode, modify the API definition, unless the
    // additionalProperties is set.
    if (defaultForbidAdditionalProperties) {
      // Set additionalProperties to false if not set already
      if ('properties' in obj && !('additionalProperties' in obj)) {
        obj.additionalProperties = false;
      }
    }

    // Ensure every operation has a operationId (required by openapi-backend validator, but not by OpenAPI v3 schema). [Issue #4]
    if (traversalPath.length === 3 
      && traversalPath[0] === 'paths' 
      && ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'].includes(traversalPath[2])) {
        if (obj.operationId === undefined) {
          obj.operationId = 'generatedOperationId_' + traversalPath[1].slice(1) + '_' + traversalPath[2] +  '_' + crypto.randomBytes(3).toString('hex');
        }
    }

    return obj;
  });

  return apiDoc;
}
