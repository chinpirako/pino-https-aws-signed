# pino-https-aws-signed-requests

A basic handler for [pino](https://github.com/pinojs/pino) logs that sends batches to a desired
endpoint via AWS signed requests, forked from [@technicallyjosh/pino-http-send](https://github.com/technicallyjosh/pino-http-send) repository.

## Installation

```console
$ npm i pino-https-aws-signed-requests
```

## API

You can  use this module as a [pino destination](https://github.com/pinojs/pino/blob/master/docs/api.md#destination).

This will use the same batching function like the CLI usage. If the batch length
is not reached within a certain time (`timeout`), it will auto "flush".

### `createWriteStream`

The options passed to this follow the same values as the CLI defined above.

| Property              | Type                    | Required/Default |
| --------------------- | ----------------------- | ---------------- |
| elkRole               | `string`                | REQUIRED         |
| elkDomain             | `string`                | REQUIRED         |
| elkIndex              | `string`                | REQUIRED         |
| batchSize             | `number`                | 10               |
| timeout               | `number`                | 5000             |

```ts
const {createWriteStream} = require('../pino-https-aws-signed');

const stream = createWriteStream({
    elkRole: process.env.ROLE, 
    elkDomain: process.env.ES_DOMAIN,
    elkIndex: process.env.ELK_INDEX,
});

const logger = Pino(
    {
        level: 'info',
    },
    stream,
);
```
