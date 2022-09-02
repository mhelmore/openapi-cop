import * as path from 'path';

export const MOCK_SERVER_DIR = path.resolve(__dirname, '../../mock-server/');
export const SCHEMAS_DIR = path.resolve(__dirname, '../../test/schemas/');

export const PROXY_PORT = 8888;
export const TARGET_SERVER_PORT = 8889;

export const DEFAULT_OPENAPI_FILE = path.join(
  SCHEMAS_DIR,
  'v3/7-petstore.yaml',
);
