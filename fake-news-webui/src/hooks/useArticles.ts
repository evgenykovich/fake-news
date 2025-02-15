import { useState, useEffect, useCallback } from 'react'
import { Article } from '../interfaces'
import { ArticleService } from '../services'

const articleService = new ArticleService()

export const useArticles = (category: string) => {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setLoading(true)
        const response = await articleService.getAllArticles(category)
        setArticles(response.articles)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchArticles()
  }, [category])

  const getArticleById = useCallback(
    async (id: string): Promise<Article | null> => {
      return await articleService.getArticleById(category, id)
    },
    [category]
  )

  return { articles, loading, error, getArticleById }
}
