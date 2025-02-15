import { ApiResponseOptions } from '@nestjs/swagger';
import { NewsCategory } from './Categories';
import { Article, ArticleResponse } from './Article';

export const API_RESPONSES = {
  ARTICLES: {
    GET_ALL: {
      status: 200,
      description: 'Returns articles with transformed headlines',
      type: ArticleResponse,
    } as ApiResponseOptions,

    GET_ONE: {
      status: 200,
      description: 'Returns a single article',
      type: Article,
    } as ApiResponseOptions,

    NOT_FOUND: {
      status: 404,
      description: 'Article not found',
    } as ApiResponseOptions,
  },

  CATEGORIES: {
    GET_ALL: {
      status: 200,
      description: 'Returns list of available categories',
      schema: {
        type: 'array',
        items: {
          type: 'string',
          enum: Object.values(NewsCategory),
        },
        example: Object.values(NewsCategory),
      },
    } as ApiResponseOptions,
  },
};

export const API_QUERIES = {
  CATEGORY: {
    name: 'category',
    required: false,
    enum: NewsCategory,
    description: 'News category to fetch',
  },
};
