import fastify, { FastifyReply } from 'fastify';
import ratelimiter from '../src';

const app = fastify({ logger: true });

app.register(ratelimiter, {
  max: 5,
  timeWindow: 10,
});

app.get('/', (_, reply: FastifyReply) => {
  reply.send('hello world');
});

app.listen(3000);
