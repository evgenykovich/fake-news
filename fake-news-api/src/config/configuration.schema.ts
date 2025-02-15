import * as Joi from 'joi';

export const configValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(8000),

  NEWS_API_KEY: Joi.string().required(),
  OPENAI_API_KEY: Joi.string().required(),

  NEWS_API_URL: Joi.string().default('https://newsapi.org/v2'),
  OPENAI_API_URL: Joi.string().default('https://api.openai.com/v1'),

  CACHE_TTL: Joi.number().default(300000),

  ALLOWED_ORIGINS: Joi.string().default('http://localhost:3000'),

  RATE_LIMIT_WINDOW: Joi.number().default(900000),
  RATE_LIMIT_MAX: Joi.number().default(100),
});
