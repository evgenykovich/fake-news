import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Container, Typography, Box } from '@mui/material'
import AutoSizer from 'react-virtualized-auto-sizer'
import { VirtualizedGrid } from '../../components'
import { Cell } from '../../components'
import { Loader } from '../../components'
import { HomePageProps } from '../../components/Grid/types'
import { ITEM_HEIGHT, GRID_PADDING, CARD_GAP } from './constants'

export const HomePage = React.memo(
  ({ articles, category, loading, error }: HomePageProps) => {
    const navigate = useNavigate()

    return (
      <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Container
          maxWidth="lg"
          sx={{ mt: 4, mb: 4, height: 'calc(100vh - 100px)' }}
        >
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            sx={{
              mb: 4,
              ml: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            Latest News{' '}
            <span className="font-bold text-blue-500">
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </span>
          </Typography>

          <Box sx={{ height: 'calc(100% - 80px)', pr: 2 }}>
            {error ? (
              <Box
                sx={{
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  gap: 2,
                }}
              >
                <Typography variant="h6" color="error">
                  Error loading articles
                </Typography>
                <Typography color="text.secondary">
                  {error || 'Please try again later'}
                </Typography>
              </Box>
            ) : loading ? (
              <Box
                sx={{
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Loader category={category} />
              </Box>
            ) : (
              <AutoSizer>
                {({ height, width }: { height: number; width: number }) => {
                  const columnCount = Math.max(
                    1,
                    width < 600 ? 1 : width < 960 ? 2 : 3
                  )
                  const rowCount = Math.ceil(articles.length / columnCount)
                  const availableWidth = width - GRID_PADDING
                  const columnWidth =
                    (availableWidth - CARD_GAP * (columnCount - 1)) /
                    columnCount

                  return (
                    <VirtualizedGrid
                      {...{
                        columnCount,
                        columnWidth,
                        height,
                        rowCount,
                        rowHeight: ITEM_HEIGHT + CARD_GAP,
                        width: availableWidth,
                        itemData: {
                          articles,
                          currentCategory: category,
                          navigate,
                          columnCount,
                        },
                      }}
                    >
                      {Cell}
                    </VirtualizedGrid>
                  )
                }}
              </AutoSizer>
            )}
          </Box>
        </Container>
      </Box>
    )
  }
)

HomePage.displayName = 'HomePage'
