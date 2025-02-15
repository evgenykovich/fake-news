import { ApiProperty } from '@nestjs/swagger';
import { NewsCategory } from '../../interfaces/Categories';

export class ArticleDto {
  @ApiProperty({
    description: 'Unique identifier of the article',
    example: '123',
  })
  id: string;

  @ApiProperty({
    description: 'Original title of the article',
    example: 'Global Economy Shows Signs of Recovery',
  })
  title: string;

  @ApiProperty({
    description: 'Brief description of the article',
    example:
      'Latest economic indicators suggest a strong rebound in global markets',
  })
  description: string;

  @ApiProperty({
    description: 'URL to the full article',
    example: 'https://example.com/article/123',
  })
  url: string;

  @ApiProperty({
    description: 'Satirical version of the title',
    example: 'Economy Decides to Take a Vacation, Promises to Send Postcards',
  })
  fake_title: string;

  @ApiProperty({
    enum: NewsCategory,
    description: 'Category of the article',
    example: NewsCategory.BUSINESS,
  })
  category: NewsCategory;
}

export class ArticleResponseDto {
  @ApiProperty({
    description: 'Status of the API response',
    example: 'ok',
  })
  status: string;

  @ApiProperty({
    type: [ArticleDto],
    description: 'Array of articles',
  })
  articles: ArticleDto[];
}
