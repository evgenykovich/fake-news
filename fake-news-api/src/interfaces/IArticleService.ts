import { Article, ArticleResponse } from './Article';
import { NewsCategory } from './Categories';

export interface IArticleService {
  getAllArticles(category: NewsCategory): Promise<ArticleResponse>;
  getArticleById(category: NewsCategory, id: string): Promise<Article | null>;
}
