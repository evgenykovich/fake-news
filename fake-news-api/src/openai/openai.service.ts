import { z } from 'zod';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAI } from 'langchain/llms/openai';
import { PromptTemplate } from 'langchain/prompts';
import { MetricsService } from '../monitoring/metrics.service';
import { NewsCategory } from '../interfaces/Categories';
import { OpenAIException } from './exceptions/openai.exception';
import { Article } from '../interfaces/Article';

const TrollTitleSchema = z.string().transform((str) => {
  const cleaned = str.replace(/^["']|["']$/g, '');
  return cleaned.trim();
});

const CategorySchema = z
  .string()
  .transform((str) => str.toLowerCase().trim())
  .pipe(z.nativeEnum(NewsCategory));

@Injectable()
export class OpenAIService {
  private model: OpenAI;
  private readonly logger = new Logger(OpenAIService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly metricsService: MetricsService,
  ) {
    this.model = new OpenAI({
      openAIApiKey: this.configService.get<string>('OPENAI_API_KEY'),
      temperature: 0.7,
      modelName: 'gpt-3.5-turbo',
    });
  }

  async generateTrollTitle(article: Article): Promise<string> {
    try {
      const template = `
      You are a satirical news editor who creates funny, absurd, and opposite versions of real news headlines. 
      Keep the tone light and humorous, but avoid offensive content.
      
      Original headline: "{title}"
      
      Create an opposite, absurd version of this headline that's funny but not offensive.`;

      const prompt = new PromptTemplate({
        template,
        inputVariables: ['title'],
      });

      const formattedPrompt = await prompt.format({
        title: article.title,
      });

      const response = await this.model.call(formattedPrompt);
      this.metricsService.incrementExternalApiRequests('openai', true);

      return TrollTitleSchema.parse(response);
    } catch (error) {
      this.metricsService.incrementExternalApiRequests('openai', false);
      if (error instanceof z.ZodError) {
        this.logger.error(`Validation error: ${error.message}`);
        throw new OpenAIException(
          `Failed to validate troll title: ${error.message}`,
        );
      }
      this.logger.error(`Error generating fake news title: ${error.message}`);
      throw new OpenAIException(
        `Error generating fake news title: ${error.message}`,
      );
    }
  }

  async deriveCategory(article: Article): Promise<NewsCategory> {
    try {
      const template = `
      You are a news categorization expert. Based on the article content and title, 
      categorize this article into exactly one of these categories: 
      ${Object.values(NewsCategory).join(', ')}.
      
      Title: "{title}"
      Content: "{content}"
      
      Return ONLY the category name in uppercase, nothing else.`;

      const prompt = new PromptTemplate({
        template,
        inputVariables: ['title', 'content'],
      });

      const formattedPrompt = await prompt.format({
        title: article.title,
        content: article.content || article.description || '',
      });

      const response = await this.model.call(formattedPrompt);
      this.metricsService.incrementExternalApiRequests('openai', true);

      return CategorySchema.parse(response.trim().toUpperCase());
    } catch (error) {
      this.metricsService.incrementExternalApiRequests('openai', false);
      if (error instanceof z.ZodError) {
        this.logger.error(`Invalid category: ${error.message}`);
        return NewsCategory.GENERAL;
      }
      this.logger.error(`Error deriving category: ${error.message}`);
      return NewsCategory.GENERAL;
    }
  }

  async enrichArticle(article: Article): Promise<{
    fake_title: string;
    derived_category: NewsCategory;
  }> {
    try {
      const [fake_title, derived_category] = await Promise.all([
        this.generateTrollTitle(article),
        this.deriveCategory(article),
      ]);

      return { fake_title, derived_category };
    } catch (error) {
      this.logger.error(`OpenAI enrichment failed: ${error.message}`);
      throw new OpenAIException(error.message);
    }
  }
}
