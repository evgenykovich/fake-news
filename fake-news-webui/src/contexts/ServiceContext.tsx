import { createContext, useContext } from 'react'
import { IArticleService } from '../interfaces'
import { ArticleService } from '../services'

const ServiceContext = createContext<IArticleService>(new ArticleService())

export const ServiceProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const articleService = new ArticleService()

  return (
    <ServiceContext.Provider value={articleService}>
      {children}
    </ServiceContext.Provider>
  )
}

export const useArticleService = () => useContext(ServiceContext)
