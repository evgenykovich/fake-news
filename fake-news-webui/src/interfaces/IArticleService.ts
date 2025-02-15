import { Article, ArticleResponse } from './Article'

export interface IArticleService {
  getAllArticles(category: string): Promise<ArticleResponse>
  getArticleById(category: string, id: string): Promise<Article | null>
}
