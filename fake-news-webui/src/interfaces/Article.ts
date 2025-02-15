export interface Source {
  id: string | null
  name: string
}

export interface Article {
  source: Source
  author: string
  title: string
  description: string
  url: string
  urlToImage: string | null
  publishedAt: string
  content: string
  fake_title?: string
  derived_category?: string
}

export interface ArticleResponse {
  status: string
  totalResults: number
  articles: Article[]
}
