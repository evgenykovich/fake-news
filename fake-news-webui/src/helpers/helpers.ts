import { CategoryColor } from '../enums'

export const getCategoryColor = (category: string): string => {
  return (
    CategoryColor[category as keyof typeof CategoryColor] ||
    CategoryColor.general
  )
}
