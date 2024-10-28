import { BadRequestException, Body, Controller, Get, Post } from '@nestjs/common';
import { AdvancedSearchService } from './advanced-search.service';

@Controller('advanced-search')
export class AdvancedSearchController {
    constructor(private advancedSearchService: AdvancedSearchService){

    }
    @Get('')
   async search(){
        //const result  = await this.advancedSearchService.templateSearch("cours_index_2","cours_search_query_2" ,{
            //"min": 0,
          //  "size": 12,
        //    "query_string": "test",
      //  })
      const result = await this.advancedSearchService.createAssistant();
        return result;
    } 

      @Post('sendMessageSearch')
      async searchUsingAssistant(
        @Body('message') message: string,
        @Body('thread') thread?: string // thread is optional
      ) {
        // Check if 'message' is provided
        if (!message) {
          throw new BadRequestException('Message is required.');
        }
    
        // Logic to handle the request, e.g., send to assistant or AI model
        const assistantResponse = await this.advancedSearchService.createAssistantResponse(message, thread);
    
        // Return the response
        return assistantResponse;
      }
    
      // Example function that handles the assistant's response
   
}
