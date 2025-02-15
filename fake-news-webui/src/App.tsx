import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { HomePage, ArticlePage } from './containers'
import { useArticles } from './hooks/useArticles'
import { useState } from 'react'
import { NavBar } from './components'
import { Box } from '@mui/material'
export const App = () => {
  const [category, setCategory] = useState('general')
  const { articles, loading, error } = useArticles(category)

  const handleCategorySelect = (newCategory: string) => {
    setCategory(newCategory)
  }

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <Router>
        <NavBar onCategorySelect={handleCategorySelect} />
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          <Routes>
            <Route
              path="/"
              element={
                <HomePage
                  articles={articles}
                  category={category}
                  loading={loading}
                  error={error}
                />
              }
            />
            <Route path="/articles/:category/:id" element={<ArticlePage />} />
          </Routes>
        </Box>
      </Router>
    </Box>
  )
}
