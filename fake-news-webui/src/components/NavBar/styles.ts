export const toolbarStyles = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
} as const

export const logoContainerStyles = {
  width: '200px',
} as const

export const logoButtonStyles = {
  textTransform: 'none',
} as const

export const mobileMenuStyles = {
  marginLeft: 'auto',
} as const

export const menuItemStyles = (isSelected: boolean) =>
  ({
    backgroundColor: isSelected ? 'rgba(0, 0, 0, 0.08)' : 'transparent',
    '&:hover': {
      backgroundColor: 'rgba(0, 0, 0, 0.04)',
    },
  } as const)

export const categoriesContainerStyles = {
  display: 'flex',
  gap: 1,
  flexGrow: 1,
  justifyContent: 'flex-start',
} as const

export const categoryButtonStyles = (isSelected: boolean) =>
  ({
    borderRadius: 1,
    backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
  } as const)
