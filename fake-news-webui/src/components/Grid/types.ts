import { NavigateOptions } from 'react-router-dom'
import { Article } from '../../interfaces/Article'

export interface HomePageProps {
  articles: Article[]
  category: string
  loading: boolean
  error: string | null
}

export interface ItemData {
  articles: Article[]
  currentCategory: string
  navigate: (path: string, options?: NavigateOptions) => void
  columnCount: number
}
