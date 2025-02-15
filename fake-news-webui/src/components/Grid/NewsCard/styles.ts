export const cardStyles = {
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  overflow: 'hidden',
  '& .MuiCardActionArea-root': {
    height: '100%',
    padding: 0,
  },
  '& .MuiCardContent-root': {
    padding: 2,
    '&:last-child': {
      paddingBottom: 2,
    },
  },
} as const

export const cardActionAreaStyles = {
  flexGrow: 1,
  display: 'flex',
  flexDirection: 'column',
} as const

export const cardContentStyles = {
  flexGrow: 1,
  display: 'flex',
  flexDirection: 'column',
} as const

export const titleStyles = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  mb: 1,
  lineHeight: 1.3,
  height: '2.6em',
} as const

export const descriptionStyles = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  display: '-webkit-box',
  WebkitLineClamp: 3,
  WebkitBoxOrient: 'vertical',
  mb: 1,
} as const

export const imageContainerStyles = {
  position: 'relative',
  display: 'flex',
  width: '100%',
  height: '200px',
  overflow: 'hidden',
  '& .MuiCardMedia-root': {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
} as const

export const categoryChipStyles = {
  position: 'absolute',
  top: 8,
  right: 8,
  borderRadius: 1,
  textTransform: 'capitalize',
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  height: '20px',
  '& .MuiChip-label': {
    px: 1,
    fontSize: '0.7rem',
  },
} as const

export const metadataContainerStyles = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 1,
  width: '100%',
  mt: 'auto',
  pt: 2,
} as const

export const sourceContainerStyles = {
  display: 'flex',
  alignItems: 'center',
  gap: 1,
  minWidth: 0,
} as const

export const sourceTextStyles = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
} as const

export const dateStyles = {
  flexShrink: 0,
} as const
