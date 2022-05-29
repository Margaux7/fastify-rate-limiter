import fastify, { FastifyReply, FastifyRequest } from 'fastify';
import rateLimiter from '../src';

const sleep = async (ms) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

describe('rate limit plugin', () => {
  it('basic', async () => {
    const app = fastify();
    const max = 5,
      timeWindow = 10;
    app.register(rateLimiter, {
      max,
      timeWindow,
    });
    app.get('/', (_, reply: FastifyReply) => {
      reply.send('hello world');
    });

    for (let i = 0; i < 5; i++) {
      const res = await app.inject().get('/');
      expect(res.statusCode).toBe(200);
    }

    let res = await app.inject().get('/');
    expect(res.statusCode).toBe(429);

    await sleep(2000);
    res = await app.inject().get('/');
    expect(res.statusCode).toBe(200);
  });

  it('with key generator and custom error handler', async () => {
    const keyGenerator = (req: FastifyRequest) =>
      (req.query as { name: string }).name;
    const errorHandler = (_, reply: FastifyReply) => {
      reply.code(429);
      reply.send('Please wait a second!');
    };

    const app = fastify();
    const max = 5,
      timeWindow = 10;
    app.register(rateLimiter, {
      max,
      timeWindow,
      keyGenerator,
      errorHandler,
    });
    app.get('/', (_, reply: FastifyReply) => {
      reply.send('hello world');
    });

    for (let i = 0; i < 5; i++) {
      const res = await app.inject().get('?name=Margaux1');
      expect(res.statusCode).toBe(200);
    }

    let res = await app.inject().get('?name=Margaux1');
    expect(res.statusCode).toBe(429);
    expect(res.body).toBe('Please wait a second!');
    res = await app.inject().get('?name=Margaux2');
    expect(res.statusCode).toBe(200);
  }, 2000);

  it('should merge user hooks', async () => {
    const userHook1 = jest.fn().mockResolvedValue(null);
    let app = fastify();
    app.register(rateLimiter);
    app
      .get('/', (_, reply: FastifyReply) => {
        reply.send('hello world');
      })
      .addHook('onRequest', userHook1);
    await app.inject().get('/');
    expect(userHook1).toBeCalled();

    const userHook2 = jest.fn().mockResolvedValue(null);
    app = fastify();
    app.register(rateLimiter);
    app.route({
      method: 'GET',
      url: '/',
      handler: (_, reply: FastifyReply) => {
        reply.send('hello world');
      },
      onRequest: [userHook1, userHook2],
    });
    await app.inject().get('/');
    expect(userHook1).toBeCalled();
    expect(userHook2).toBeCalled();
  });
});
