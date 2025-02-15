import { ApiProperty } from '@nestjs/swagger';

export class Source {
  @ApiProperty({ example: 'cnn', nullable: true })
  id: string | null;

  @ApiProperty({ example: 'CNN' })
  name: string;
}

export class Article {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'Breaking News: Major Discovery' })
  title: string;

  @ApiProperty({
    example: 'Scientists have made a groundbreaking discovery...',
  })
  description: string;

  @ApiProperty({ example: 'https://example.com/article/123' })
  url: string;

  @ApiProperty({
    example: 'https://example.com/images/article123.jpg',
    nullable: true,
  })
  urlToImage?: string;

  @ApiProperty({ type: Source })
  source: Source;

  @ApiProperty({ example: 'John Doe', nullable: true })
  author: string | null;

  @ApiProperty({ example: 'Full article content...', nullable: true })
  content: string | null;

  @ApiProperty({ example: '2024-01-20T12:00:00Z' })
  publishedAt: string;

  @ApiProperty({ enum: ['pending', 'completed', 'failed'], required: false })
  enrichmentStatus?: 'pending' | 'completed' | 'failed';

  @ApiProperty({ required: false, example: 'Humorous version of the title' })
  fake_title?: string;

  @ApiProperty({ required: false, example: 'Satirical version of the content' })
  satiricalContent?: string;
}

export class ArticleResponse {
  @ApiProperty({ example: 'ok' })
  status: string;

  @ApiProperty({ example: 10 })
  totalResults: number;

  @ApiProperty({ type: [Article] })
  articles: Article[];
}
