/**
 * Utility script for spawning a proxy server and a mock server that are
 * based on a given OpenAPI document. The path to the OpenAPI file can be
 * provided as the first CLI argument.
 *
 * Use the npm script 'dev-start-along-mock' for conveniently running this script,
 * e.g.:
 *      npm run dev-start-along-mock -- path_to_schema/file.yaml
 *
 * Run without arguments to use the hard-coded path:
 *      npm run dev-start-along-mock
 *
 */

import * as path from 'path';

import { PROXY_PORT, TARGET_SERVER_PORT } from '../config';
import { spawnProxyWithMockServer } from './testing';

const apiDocFile =
  process.argv[2] ||
  path.resolve(__dirname, '../../../test/schemas/v3/3-parameters.yaml');

spawnProxyWithMockServer(PROXY_PORT, TARGET_SERVER_PORT, apiDocFile, {
  stdio: 'inherit',
});
