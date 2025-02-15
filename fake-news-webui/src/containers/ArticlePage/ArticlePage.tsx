import { useEffect, useState } from 'react'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import {
  Container,
  Typography,
  Box,
  Chip,
  Link,
  Button,
  Divider,
  AppBar,
  Toolbar,
  CircularProgress,
  Tooltip,
} from '@mui/material'
import { useArticles } from '../../hooks'
import { Article } from '../../interfaces'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { getCategoryColor } from '../../helpers'
import { defaultLabels } from '../../enums'

export const ArticlePage = () => {
  const navigate = useNavigate()
  const { state } = useLocation()
  const { id, category } = useParams()
  const [article, setArticle] = useState<Article | null>(state?.article || null)

  const { articles, loading, getArticleById } = useArticles(
    category || defaultLabels.GENERAL
  )

  useEffect(() => {
    if (!id || loading) return

    const fetchArticle = async () => {
      const foundArticle = await getArticleById(id)
      setArticle(foundArticle)

      if (!foundArticle) {
        navigate('/')
      }
    }

    fetchArticle()
  }, [id, articles, loading, getArticleById, navigate])

  if (loading) {
    return (
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress />
      </Box>
    )
  }

  if (!article) {
    return (
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography variant="h5">Article not found</Typography>
      </Box>
    )
  }
  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar
        position="sticky"
        color="inherit"
        elevation={0}
        sx={{
          backgroundColor: 'background.paper',
        }}
      >
        <Container maxWidth="md">
          <Toolbar disableGutters>
            <Button
              onClick={() => navigate('/')}
              startIcon={<ArrowBackIcon />}
              sx={{
                ml: -2,
                color: 'text.secondary',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.04)',
                },
              }}
            >
              Back to News
            </Button>
          </Toolbar>
        </Container>
      </AppBar>

      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        <Container maxWidth="md" sx={{ py: 4 }}>
          {article.urlToImage && (
            <Box
              sx={{
                width: '100%',
                height: { xs: '300px', md: '500px' },
                position: 'relative',
                mb: 4,
                borderRadius: 2,
                overflow: 'hidden',
              }}
            >
              <img
                src={article.urlToImage}
                alt={article.title}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center',
                }}
              />
            </Box>
          )}

          <Box sx={{ mb: 4 }}>
            <Tooltip
              title={article.title}
              arrow
              placement="top"
              enterDelay={500}
              sx={{ cursor: 'help' }}
            >
              <Typography
                variant="h3"
                component="h1"
                gutterBottom
                sx={{
                  mb: 3,
                  lineHeight: 1.3,
                  fontWeight: 700,
                  fontSize: {
                    xs: '1.75rem',
                    sm: '2.25rem',
                    md: '2.75rem',
                    lg: '3rem',
                  },
                }}
              >
                {article.fake_title}
              </Typography>
            </Tooltip>

            <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap' }}>
              <Chip
                label={article.source.name}
                sx={{
                  borderRadius: 1,
                  backgroundColor: 'primary.main',
                  color: 'white',
                }}
              />
              <Chip
                label={article.derived_category || defaultLabels.GENERAL}
                variant="outlined"
                sx={{
                  borderRadius: 1,
                  textTransform: 'capitalize',
                  borderColor: getCategoryColor(
                    article.derived_category || defaultLabels.GENERAL
                  ),
                  color: getCategoryColor(
                    article.derived_category || defaultLabels.GENERAL
                  ),
                  '&:hover': {
                    backgroundColor: `${getCategoryColor(
                      article.derived_category || defaultLabels.GENERAL
                    )}10`,
                  },
                }}
              />
              {article.author && (
                <Chip
                  label={`By ${article.author}`}
                  variant="outlined"
                  sx={{ borderRadius: 1 }}
                />
              )}

              <Chip
                label={new Date(article.publishedAt).toLocaleDateString(
                  'en-US',
                  {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  }
                )}
                variant="outlined"
                sx={{ borderRadius: 1 }}
              />
            </Box>
          </Box>

          <Box sx={{ mb: 6 }}>
            <Typography
              variant="subtitle1"
              sx={{
                mb: 4,
                fontSize: '1.4rem',
                lineHeight: 1.6,
                color: 'text.secondary',
                fontStyle: 'italic',
              }}
            >
              {article.description}
            </Typography>

            <Typography
              variant="body1"
              sx={{
                mb: 4,
                lineHeight: 1.8,
                fontSize: '1.1rem',
              }}
            >
              {article?.content?.replace(/\[\+\d+ chars\]$/, '')}
              <Link
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  ml: 1,
                  color: 'primary.main',
                  textDecoration: 'none',
                  fontWeight: 500,
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                Continue reading →
              </Link>
            </Typography>
          </Box>
          <Divider />
        </Container>
      </Box>
    </Box>
  )
}
