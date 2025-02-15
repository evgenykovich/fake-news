import { Box, LinearProgress, Typography } from '@mui/material'
import { containerStyles, titleStyles, progressStyles } from './styles'

interface LoaderProps {
  category: string
}

export const Loader = ({ category }: LoaderProps) => {
  return (
    <Box
      className="flex flex-col items-center justify-center p-8"
      sx={containerStyles}
    >
      <Typography variant="h6" className="text-gray-600" sx={titleStyles}>
        Loading {category} articles...
      </Typography>

      <LinearProgress sx={progressStyles} />
    </Box>
  )
}
