import { Article } from './Article';
import { NewsCategory } from './Categories';

export interface IOpenAIService {
  generateTrollTitle(article: Article): Promise<string>;
  deriveCategory(article: Article): Promise<NewsCategory>;
  enrichArticle(article: Article): Promise<{
    fake_title: string;
    derived_category: NewsCategory;
  }>;
}
