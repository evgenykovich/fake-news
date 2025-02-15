import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, Matches } from 'class-validator';
import { NewsCategory } from '../../interfaces/Categories';

export class GetArticleDto {
  @ApiProperty({
    enum: NewsCategory,
    description: 'News category',
  })
  @IsEnum(NewsCategory)
  category: NewsCategory;

  @ApiProperty({
    description: 'Article ID (index in the array)',
    example: '0',
  })
  @IsString()
  @Matches(/^\d+$/, {
    message: 'id must be a non-negative integer',
  })
  id: string;
}
