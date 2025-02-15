import React from 'react'
import {
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Chip,
} from '@mui/material'
import { Article } from '../../../interfaces/Article'
import { getCategoryColor } from '../../../helpers'
import { defaultLabels } from '../../../enums'
import {
  cardStyles,
  titleStyles,
  descriptionStyles,
  imageContainerStyles,
  cardActionAreaStyles,
  cardContentStyles,
  categoryChipStyles,
  dateStyles,
  metadataContainerStyles,
  sourceContainerStyles,
  sourceTextStyles,
} from './styles'
import PlaceholderImage from '../../../assets/placeholder-image.webp'

interface NewsCardProps {
  article: Article
  onClick: () => void
}

export const NewsCard = React.memo(({ article, onClick }: NewsCardProps) => (
  <Card sx={cardStyles}>
    <CardActionArea onClick={onClick} sx={cardActionAreaStyles}>
      <Box sx={imageContainerStyles}>
        <CardMedia
          component="img"
          image={article.urlToImage || PlaceholderImage}
          alt={article.fake_title}
        />
        <Chip
          label={article.derived_category || defaultLabels.GENERAL}
          size="small"
          variant="outlined"
          sx={{
            ...categoryChipStyles,
            borderColor: getCategoryColor(
              article.derived_category || defaultLabels.GENERAL
            ),
            color: getCategoryColor(
              article.derived_category || defaultLabels.GENERAL
            ),
          }}
        />
      </Box>
      <CardContent sx={cardContentStyles}>
        <Typography gutterBottom variant="h6" component="h2" sx={titleStyles}>
          {article.fake_title}
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={descriptionStyles}
        >
          {article.description}
        </Typography>

        <Box sx={metadataContainerStyles}>
          <Box sx={sourceContainerStyles}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={sourceTextStyles}
            >
              {article.source.name}
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={dateStyles}>
            {new Date(article.publishedAt).toLocaleDateString()}
          </Typography>
        </Box>
      </CardContent>
    </CardActionArea>
  </Card>
))

NewsCard.displayName = 'NewsCard'
