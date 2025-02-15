import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import { ArticleService } from '../../services/ArticleService'
import { DEFAULT_CATEGORIES } from '../../constants'
import {
  toolbarStyles,
  logoContainerStyles,
  logoButtonStyles,
  mobileMenuStyles,
  menuItemStyles,
  categoriesContainerStyles,
  categoryButtonStyles,
} from './styles'

export const NavBar = ({
  onCategorySelect,
}: {
  onCategorySelect: (category: string) => void
}) => {
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedCategory, setSelectedCategory] = useState('general')
  const [categories, setCategories] = useState<string[]>([])

  useEffect(() => {
    const articleService = new ArticleService()
    const fetchCategories = async () => {
      try {
        const fetchedCategories = await articleService.getCategories()
        setCategories(fetchedCategories)
      } catch (error) {
        console.error('Failed to fetch categories:', error)
        setCategories(DEFAULT_CATEGORIES)
      }
    }

    fetchCategories()
  }, [])

  const handleCategoryClick = (category: string) => {
    navigate('/')
    onCategorySelect(category.toLowerCase())
    setSelectedCategory(category)
    setAnchorEl(null)
  }

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  return (
    <AppBar position="static">
      <Toolbar sx={toolbarStyles}>
        <Box sx={logoContainerStyles}>
          <Button
            color="inherit"
            onClick={() => navigate('/')}
            sx={logoButtonStyles}
          >
            <Typography variant="h6" component="div">
              News App
            </Typography>
          </Button>
        </Box>

        {isMobile ? (
          <Box sx={mobileMenuStyles}>
            <IconButton
              color="inherit"
              aria-label="menu"
              onClick={handleMenuOpen}
              edge="end"
            >
              <MenuIcon />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              {categories.map((category) => (
                <MenuItem
                  key={category}
                  onClick={() => handleCategoryClick(category)}
                  sx={menuItemStyles(
                    selectedCategory === category.toLowerCase()
                  )}
                >
                  {category}
                </MenuItem>
              ))}
            </Menu>
          </Box>
        ) : (
          <Box sx={categoriesContainerStyles}>
            {categories.map((category) => (
              <Button
                key={category}
                color="inherit"
                onClick={() => handleCategoryClick(category)}
                sx={categoryButtonStyles(
                  selectedCategory === category.toLowerCase()
                )}
              >
                {category}
              </Button>
            ))}
          </Box>
        )}
      </Toolbar>
    </AppBar>
  )
}
