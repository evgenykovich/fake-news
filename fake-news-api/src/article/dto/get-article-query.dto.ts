import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetArticleQueryDto {
  @ApiPropertyOptional({
    description: 'Wait for article enrichment to complete before returning',
    type: Boolean,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  waitForEnrichment?: boolean;
}
