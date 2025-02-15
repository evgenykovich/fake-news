import { IArticleService } from '../interfaces/IArticleService'
import { Article, ArticleResponse } from '../interfaces/Article'

export class ArticleService implements IArticleService {
  private readonly baseUrl: string

  constructor() {
    this.baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000'
  }

  async getAllArticles(category: string): Promise<ArticleResponse> {
    try {
      const url = `${this.baseUrl}/articles?category=${category}`

      const response = await fetch(url)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        )
      }

      return await response.json()
    } catch (error) {
      throw new Error(`Failed to fetch articles: ${error}`)
    }
  }

  async getArticleById(category: string, id: string): Promise<Article | null> {
    try {
      const response = await fetch(`${this.baseUrl}/articles/${category}/${id}`)

      if (!response.ok) {
        if (response.status === 404) {
          return null
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      throw new Error(`Failed to fetch article: ${error}`)
    }
  }

  async getCategories(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/articles/categories`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      throw new Error(`Failed to fetch categories: ${error}`)
    }
  }
}
