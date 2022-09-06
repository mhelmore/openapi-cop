# openapi-cop

OpenAPI **Co**mpliance **P**roxy that validates requests and responses against an OpenAPI document.

## Concept

Place the proxy between a client (e.g. a frontend app) and a web server to catch invalid requests or responses during
development.

<p align="center">
  <img src="https://raw.githubusercontent.com/EXXETA/openapi-cop/master/docs/resources/diagram.png" alt="Proxy Diagram" width="571.5">
</p>

The proxy validates the requests and responses in the communication with a target server. By default, the proxy will
respond with a 500 status code when the validation fails. In production environments, you can set the _silent_ flag to
forward unmodified response bodies.

You can find more information at the [GitHub page](https://github.com/EXXETA/openapi-cop).

## Usage

The image will always run openapi-cop on port 8888 of the container. You
should [expose](https://docs.docker.com/config/containers/container-networking/) this port to the host. Make sure
as well that the container running openapi-cop has access to the target server (see TARGET below).

The image accepts the following environment variables, which correspond to the
same [openapi-cop CLI flags](https://github.com/EXXETA/openapi-cop#cli-usage):

- `TARGET`: The URI of the target server. Must include the port, e.g. http:\/\/somehostname:1234.
- `FILE`: The file path or URI pointing to the OpenAPI definition file. Supports JSON or YAML.
- `DEFAULT_FORBID_ADDITIONAL_PROPERTIES`: When set, additional properties that are not present in the OpenAPI definition
  are not allowed.
- `SILENT`: When set, the proxy will forward response bodies unchanged and only set validation headers.
- `VERBOSE`: When set, activates verbose output.
- `NODE_ENV` (default: "production"): When set to "development", stack traces will also be logged.

### Example

The following command will run the proxy against a provided target server, taking as a reference a given OpenAPI
document, and expose port 8888 to the host system.

```docker run --rm -p 8888:8888 --env TARGET=https://some-host-name:1234 --env FILE=some-openapi-document.json lxlu/openapi-cop```

## License

See https://github.com/EXXETA/openapi-cop/blob/master/LICENSE.
