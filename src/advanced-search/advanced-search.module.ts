import { Module } from '@nestjs/common';
import { AdvancedSearchController } from './advanced-search.controller';
import { AdvancedSearchService } from './advanced-search.service';

@Module({
  controllers: [AdvancedSearchController],
  providers: [AdvancedSearchService]
})
export class AdvancedSearchModule {}
