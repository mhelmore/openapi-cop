import {AxiosRequestConfig} from 'axios';
import * as http from 'http';


export interface TestRequests {
  [fileName: string]: TestRequestConfig[];
}

export type TestRequestConfig = AxiosRequestConfig & { expectedError?: any };

export interface TestResponses {
  [fileName: string]: TestResponseConfig;
}

export type TestResponseConfig = Array<{
  request: TestRequestConfig;
  runServer: () => Promise<http.Server>;
  expectedError: any;
}>;
