# Tests

openapi-cop uses Mocha to define tests. Test files are `/test/*.test.ts` and are executed in alphabetical
order.

* 📄 **01.unit.test.ts** -- tests ability to read OpenAPI documents.
* 📄 **01.integration.test.ts** -- tests validation of requests/responses with different configurations.

## Adding tests

In the most simple and common scenario, adding a test just means

1. adding one new OpenAPI file to the `/test/schemas/` directory, and
2. adding additional test data to `/test/test-requests/` or `/test/test-responses/`.

In general, do not modify or delete existing tests, schemas or test requests/responses. Add new
tests/schemas/requests/responses instead.

### Adding schemas

When adding a new test OpenAPI file to `schemas/` keep in mind the following:

* Equivalent v2 and v3 OpenAPI documents are provided.
* A [operationId](https://spec.openapis.org/oas/v3.1.0#operation-object) is set for every operation. Otherwise, the
  mock server is not able to generate mock
  responses, nor is a validator created for the given operation.
* Files that are referenced locally (with a JSON-schema reference '$ref') should be placed in the `/schemas/refs/`
  folder.

## Debugging tests

When debugging tests, it is helpful to use the script `dev-start-along-mock` to run openapi-cop along with a mock server
that are both based on a given OpenAPI file, e.g.

````bash
# openapi-cop will listen on port 8888 and the mock server on port 8889
npm run dev-start-along-mock -- test/schemas/v3/6-examples.yaml
````

The mock server uses the "examples" from the OpenAPI document to produce responses.

If you wish to start openapi-cop and a mock server that is based on a different OpenAPI document, you can use
the `dev-start` scripts:

````bash
npm run dev-start -- some-openapi.yaml # listens on port 8888
(cd mock-server && npm run dev-start -- another-openapi.yaml) # listens on port 8889
````
