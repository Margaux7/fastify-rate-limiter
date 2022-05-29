import TokenBucketLimiter, { LimiterOpts } from './rateLimiter';
import {
  FastifyInstance,
  RouteOptions,
  FastifyRequest,
  FastifyReply,
} from 'fastify';
import fp from 'fastify-plugin';

type RateLimiterPluginOpts = LimiterOpts & {
  keyGenerator?: (req: FastifyRequest) => string;
  errorHandler?: (req: FastifyRequest, reply: FastifyReply) => void;
};

const defaultErrorHandler =
  (limiter: TokenBucketLimiter) => (_, reply: FastifyReply) => {
    reply.header('Retry-After', limiter.after);
    reply.code(429);
    reply.send(new Error(`Too many requests, retry after ${limiter.after}s.`));
  };

const defaultKeyGenerator = (req: FastifyRequest) => req.ip;

const checkParams = (opts: RateLimiterPluginOpts) => {
  if (opts.errorHandler && typeof opts.errorHandler !== 'function') {
    throw new TypeError('errorHandler must be a function!');
  }

  if (opts.keyGenerator && typeof opts.keyGenerator !== 'function') {
    throw new TypeError('keyGenerator must be a function!');
  }
};

const limitHandler = ({
  limiter,
  opts,
}: {
  limiter: TokenBucketLimiter;
  opts: RateLimiterPluginOpts;
}) => {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    const keyGenerator = opts.keyGenerator || defaultKeyGenerator;
    const errorHandler = opts.errorHandler || defaultErrorHandler(limiter);
    const { rejected, remain } = limiter.check(keyGenerator(req));

    if (rejected) {
      errorHandler(req, reply);
      return;
    }

    reply.header('X-RateLimit-Limit', limiter.capacity);
    reply.header('X-RateLimit-Remaining', remain);
    return;
  };
};

async function rateLimitPlugin(
  fastify: FastifyInstance,
  opts: RateLimiterPluginOpts,
) {
  checkParams(opts);
  const limiter = new TokenBucketLimiter({
    max: opts.max,
    timeWindow: opts.timeWindow,
  });

  fastify.addHook('onRoute', (routeOpts: RouteOptions) => {
    const handler = limitHandler({ limiter, opts });

    if (Array.isArray(routeOpts.onRequest)) {
      routeOpts.onRequest.push(handler);
    } else if (typeof routeOpts.onRequest === 'function') {
      routeOpts.onRequest = [routeOpts.onRequest, handler];
    } else {
      routeOpts.onRequest = [handler];
    }
  });
}

export default fp(rateLimitPlugin, {
  name: 'fastify-rate-limiter',
});
