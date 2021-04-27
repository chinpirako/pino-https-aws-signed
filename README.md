# pino-https-aws-signed

A basic handler for [pino](https://github.com/pinojs/pino) logs that sends batches to a desired
endpoint via AWS signed requests, forked from [@technicallyjosh/pino-http-send](https://github.com/technicallyjosh/pino-http-send) repository.

## Installation

```console
$ npm i pino-https-aws-signed
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
| elkRoleSessionName    | `string`                | REQUIRED         |
| elkDomain             | `string`                | REQUIRED         |
| elkRegion             | `string`                | REQUIRED         |
| elkIndex              | `string`                | REQUIRED         |
| elkDoctype            | `string`                | REQUIRED         |
| batchSize             | `number`                | 10               |
| timeout               | `number`                | 5000             |

```ts
const {createWriteStream} = require('../pino-https-aws-signed');

const stream = createWriteStream({
    elkRole: process.env.ROLE, 
    elkRoleSessionName: process.env.ROLE_SESSION_NAME,
    elkDomain: process.env.ES_DOMAIN,
    elkRegion: process.env.ELK_REGION,
    elkIndex: process.env.ELK_INDEX,
    elkDocType: process.env.ELK_DOC_TYPE
});

const logger = Pino(
    {
        level: 'info',
    },
    stream,
);
```
