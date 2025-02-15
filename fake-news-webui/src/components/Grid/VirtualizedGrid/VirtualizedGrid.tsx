import { forwardRef, Ref, ComponentType } from 'react'
import { FixedSizeGrid, FixedSizeGridProps } from 'react-window'
import { ItemData } from '../types'

export const VirtualizedGrid = forwardRef<
  FixedSizeGrid,
  FixedSizeGridProps<ItemData>
>((props, ref) => {
  const Grid = FixedSizeGrid as unknown as ComponentType<
    FixedSizeGridProps<ItemData> & { ref?: Ref<FixedSizeGrid> }
  >
  return <Grid {...props} ref={ref} />
})

VirtualizedGrid.displayName = 'VirtualizedGrid'
