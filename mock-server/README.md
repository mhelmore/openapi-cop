# OpenAPI Mock Server

Mock server that based
on [openapi-backend express-ts-mock](https://github.com/anttiviljami/openapi-backend/tree/c34c97e53f94034dee2908f25f724b9e39cf4c0b/examples/express-ts-mock)
example. It mocks responses using the [examples](https://swagger.io/docs/specification/adding-examples/) defined in the
OpenAPI document.

## QuickStart

```bash
npm install
npm run dev # API running at //localhost:8889
```

Try the endpoints:

```bash
curl -i http://localhost:8889/pets
curl -i http://localhost:8889/pets/1
curl -i -X POST -d {} http://localhost:8889/pets

curl -i -X POST -d '{"data": "sent"}' -H "Content-Type:application/json" http://localhost:8889/pets
```
