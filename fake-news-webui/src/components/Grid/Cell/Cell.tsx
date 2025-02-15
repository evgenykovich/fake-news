import type { GridChildComponentProps } from 'react-window'
import { Box } from '@mui/material'
import { NewsCard } from '../NewsCard/NewsCard'
import { ItemData } from '../types'

const CellComponent = ({
  columnIndex,
  rowIndex,
  style,
  data,
}: GridChildComponentProps<ItemData>) => {
  const { articles, currentCategory, navigate, columnCount } = data
  const index = rowIndex * columnCount + columnIndex
  const article = articles[index]
  if (!article) return null

  return (
    <Box style={style}>
      <Box sx={{ p: 1.5, height: 'calc(100% - 24px)' }}>
        <NewsCard
          article={article}
          onClick={() =>
            navigate(`/articles/${currentCategory}/${index}`, {
              state: { article },
            })
          }
        />
      </Box>
    </Box>
  )
}

// @ts-ignore
export const Cell = CellComponent
