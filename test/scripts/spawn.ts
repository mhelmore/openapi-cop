/**
 * Utility script for spawning a openapi-cop instance and a mock server in parallel
 * that are both based on a given OpenAPI document.
 *
 * node ./spawn [openapi-path]
 *
 *     openapi-path (optional): path to the OpenAPI file on which both the proxy server
 *             and the mock server will be based on. Defaults to a hard-coded file.
 *
 * This script is called/aliased by `npm run dev-start-along-mock`.
 */

import * as path from 'path';

import {PROXY_PORT, TARGET_SERVER_PORT} from '../config';
import {spawnProxyWithMockServer} from '../util/server';

const apiDocFile =
  process.argv[2] ||
  path.resolve(__dirname, '../../../test/schemas/v3/3-parameters.yaml');

spawnProxyWithMockServer(PROXY_PORT, TARGET_SERVER_PORT, apiDocFile, {
  stdio: 'inherit',
});
