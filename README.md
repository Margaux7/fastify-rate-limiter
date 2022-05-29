# fastify-rate-limiter

[![Test](https://github.com/Margaux7/fastify-rate-limiter/actions/workflows/test.yml/badge.svg)](https://github.com/Margaux7/fastify-rate-limiter/actions/workflows/test.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![npm](https://img.shields.io/npm/v/fastify-rate-limiter.svg?style=flat-square)](https://www.npmjs.com/package/fastify-rate-limiter)

Simple rate limiter plugin based on memory and [token bucket](https://en.wikipedia.org/wiki/Token_bucket) algorithm.

## Installation

```bash
yarn add fastify-rate-limiter
```

## Usage

```js
import fastify, { FastifyReply } from 'fastify';
import ratelimiter from 'fastify-rate-limiter';

const app = fastify({ logger: true });

app.register(ratelimiter, {
  max: 5,
  timeWindow: 10,
});

app.get('/', (_, reply: FastifyReply) => {
  reply.send('hello world');
});

app.listen(3000);
```

## Options

`max`: Maximum number of requests allowed in a time window, default is `100`.

`timeWindow`: Time window value in seconds, default is `60`

`keyGenerator`: A function to generate a unique identifier for each incoming request, default unique identifier is `request.ip`.

`errorHandler`: A handler function to customize response when limit reached: `(req, request) => void`

## Response headers

### request accepted

Rate limiting related headers will be added automatically.

`X-RateLimit-Limit`: Your max param, indicate the token bucket capacity.

`X-RateLimit-Remaining`: The number of remaining requests that can currently be accepted.

### request rejected

`Retry-After`: Minimum wait time before next request can be sent. You can use `errorHandler` to customize your response header or do something else.
