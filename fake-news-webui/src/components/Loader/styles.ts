export const containerStyles = {
  width: '100%',
  maxWidth: '600px',
  margin: '0 auto',
} as const

export const titleStyles = {
  textTransform: 'capitalize',
  color: 'text.secondary',
  mb: 4,
} as const

export const progressStyles = {
  width: '100%',
  height: 8,
  borderRadius: 4,
  '& .MuiLinearProgress-bar': {
    borderRadius: 4,
  },
} as const
