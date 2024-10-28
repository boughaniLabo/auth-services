import { Client } from '@elastic/elasticsearch';
import { Injectable } from '@nestjs/common';
import axios from 'axios';
import OpenAI from "openai";

import {constant} from "./constants"
import { EsCours } from './dto/elastic.cours.dto';
import { EsRessource } from './dto/elastic.ressources.dto';
@Injectable()
export class AdvancedSearchService {
    private readonly client;
    private readonly openai;
    thread:any
    private globalSearch = {
      cours:null  , 
      ressources:null,
      gpt:null,
      externelRessources:null,
      externalCours:null,
    
    }
    constructor() {
      // Define baseURL for axios
      this.client = axios.create({
        baseURL: 'https://ochelk.parene.org/elastic/', // Include trailing slash
        auth: {
          username: 'elastic',
          password: 'O_r5iYz*Z9vLtVMbY7yi',
        },
 
      });
      this.openai = new OpenAI({
        apiKey: "",
    });
    }
  
    // Axios request to Elasticsearch for template search
    async templateSearch(index: string, templateId: string, params: Record<string, any>) {
      try {
        const response = await this.client.post(`/${index}/_search/template`, {
          id: templateId, // The ID of the stored template
          params: params, // Dynamic parameters for the template
        });
        return response.data;
      } catch (error) {
        console.error('Error in template search:', JSON.stringify(error, null, 2)); // Full error details
        throw new Error(`Error in template search: ${error.response?.data || error.message}`);
      }
    }
    async getGlobalSearch(query){

    }
  
    async searchCours(params){
      const coursResult = await this.templateSearch(constant.COUR_INDEX , constant.COURS_TEMPLATE , params) ; 
      return coursResult;
    }
    async searchRessource(params){
      const coursRessource = await this.templateSearch(constant.RESSOURCE_INDEX , constant.RESSOURCE_TEMPLATE , params) ; 
      return coursRessource;
    }

    async createAssistant(){
      const assistant = await this.openai.beta.assistants.create({
        model: "gpt-4o",
        instructions:
        `Tu es un système expert en recherche d'information (RI). Tu accompli trois tâches principales :
        tout thread ne depend pas d'autre il faut que pour cheque thread je aurais tout ces question .

        vous devez respcter les etape suivant avant t'utilise le tools (function calling). 
1) La première : Tu interagis avec l'utilisateur pour connaitre les paramètres de sa requête de RI.
-Paramètres : Il en faut au moins 1 parmi ceux listés ci-dessous :
-- le thème ou le sujet  : que tu dois détecter pour la recherche globale   
                     -- la source :  détecte si c'est (interne Parene ou externe du web ou les deux). Par défaut prend les deux. 
                      --  type de ressources attendues que tu dois détecter  ( Documents ou cours ou les deux) par défaut les deux 
                      -- et des information facultatives comme :  Source de diffusion (gallica , persée , hal , unirioja , openedition , erudit , canal-u , unisciel ,  teluq , …) ; Type documentaire (Texte , Image , Image fixe , Chapitre de livre , Autres Article , Autre , Carte , Musique , …) ; mot-clé ; Auteurs ; Éditeurs ; Titre ; Langue   ; Niveau (enseignement supérieur , licence , formation continue , master ,  doctorat , bac+1 , bac+2 ,  bac+3 , enseignement secondaire , enseignement ,  primaire ) ;
    Description du contenu ; Diplôme ; Pays ; Établissement ; Diffuseur (Fun Mooc, Udemy, Edx, Coursera, tout) , Prix (Gratuit, fourchette de prix).
          - tu récapitules les informations récupérées et tu demandes à l'utilisateur de confirmer
          - s'il confirme, tu vas à la seconde tache, sinon tu demandes des précisions pour compléter ou tu reviens à la première tâche.
          une fois vous avez une reponse de de output de la function calling il faut juste faire un resumer sans lister les ressource  cette etape est obligatoire .
          `
          
          ,
          tools : [
            {
                "type": "function",
                "function": {
                    "name": "call_rag",
                    "description": "call the rag function to get the answer",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "query_string": {
                                "type": "string",
                                "description": "le theme de la recherche",
                            },
        
                            "title": {
                                "type": "string",
                                "description": "title of the content eg: 'infomatiques'",
        
                            },
                            "author": {
                                "type": "string",
                                "description": "author of the content eg: 'michel'",
                            },
                            "keyword": {
                                "type": "string",
                                "description": "keyword of the content eg: 'info'",
                            },
                            "editeur": {
                                "type": "string",
                                "description": "editeur of the content eg: 'michel'",
                            },
                            "langue": {
                                "type": "string",
                                "enum": ["fra", "eng","spa", "ita","lat", "deu","por", "nld","zho","rus"],
                                "description": "langue of the content eg: 'français'",
                            },
                            "type": {
                                "type": "string",
                                "enum": ["Texte", "Autres","Ressource interactive","ressource multimédia","Image","Image fixe","Carte","Objet physique"],
                                "description": "provider of the content document eg: 'Texte'",
                               
                            },
                            "provider": {
                              "type": "string",
                              "enum": ["fun mooc", "udemy"],
                              "description": "the type of the content  eg: 'fun mooc'",
                             
                          },
                            "source": {
                              "type": "string",
                              "enum": ["gallica", "persée","hal", "unirioja","openedition", "erudit","ird", "canal-u","unisciel","teluq"],
                              "description": "source  of the content eg: 'gallica'",
                             
                          },
                          "diplomation": {
                            "type": "string",
                            "enum": ["Certifiant"],
                            "description": "diplome est ce que elle certfifier : 'Certifiant'",
                           
                        },
                            "niveau": {
                                "type": "string",
                                "enum": ["enseignement supérieur", "formation continue", "master" , "licence","doctorat","(bac+1)","(bac+2)","(bac+3)","enseignement secondaire","enseignement primaire"],
                                "description": "niveau of the content eg: '1'",
                            },
        
                            "search_type": {
                                "type": "string",
                                "enum": ["document", "cours", "both"],
                                "default": "both",
                                "description": "type of search eg: 'both'",
                            },
                            "reference_type": {
                                "type": "string",
                                "enum":  ["interne", "externe", "both"],
                                "default": "both",
                                "description": "type of reference eg: 'both'",
                            },
                        },
                        "required": ["search_type" , "reference_type"],
                    },
                }
            }
        ]
      });
      return assistant;
    }
    async createAssistantResponse(message, thread = null){
      console.log("############################",thread);
      
      if( !thread){
        this.thread = await this.openai.beta.threads.create({
          messages : []
        })
        thread = this.thread.id
      }else {
        this.thread = thread
      }
      let content = [] ; 
      if (message) {
        content.push({
          type: 'text',
          text: message,
        });
      }
      const thread_message = await this.openai.beta.threads.messages.create(
        thread,
        {
          role: "user",
          content: content,
        })
        const run = await this.openai.beta.threads.runs.createAndPoll(thread, {
          assistant_id: "asst_OdqZoFVYDUPgtKXDkORmeSKc"
        })
        
        return this.handleRunStatus(run,thread)
    
       
    }
    async handleRequiresAction (run , thread){
        // Check if there are tools that require outputs
  if (
    run.required_action &&
    run.required_action.submit_tool_outputs &&
    run.required_action.submit_tool_outputs.tool_calls
  ) {
    // Loop through each tool in the required action section
    const toolOutputs = [];

    for (const tool of run.required_action.submit_tool_outputs.tool_calls) {
      console.log(tool.function.name);
      if (tool.function.name === "call_rag") {
        this.globalSearch = {
          cours:null  , 
          ressources:null,
          gpt:null,
          externelRessources:null,
          externalCours:null,
        
        }

        const result = await this.extractAndSearch(tool.function.arguments);
        toolOutputs.push({
          tool_call_id: tool.id,
          output: "Donne moi juste un resume de cotenu dans les listé    " + JSON.stringify(this.globalSearch.cours) + ' ' +  JSON.stringify(this.globalSearch.ressources),
        });
      }
    }
    
    // Submit all tool outputs at once after collecting them in a list
    if (toolOutputs.length > 0) {
      run = await this.openai.beta.threads.runs.submitToolOutputsAndPoll(
        thread,
        run.id,
        { tool_outputs:  toolOutputs },
      );
      console.log("Tool outputs submitted successfully.");
    } else {
      console.log("No tool outputs to submit.");
    }

    // Check status after submitting tool outputs
    return this.handleRunStatus(run,thread);
  }
 }
  async  handleRunStatus (run,thread){
      // Check if the run is completed
    if (run.status === "completed") {
      let messages = await this.openai.beta.threads.messages.list(thread);
      this.globalSearch.gpt =  messages.data;
      const finalResult = {...this.globalSearch} ; 
      this.globalSearch = {
        cours:null , 
        gpt:null ,
        ressources:null , 
        externalCours:null, 
        externelRessources:null
      }
      return {...finalResult , thread:thread};
    } else if (run.status === "requires_action") {
      console.log(run.status);
      return await this.handleRequiresAction(run,thread);;
    } else {
      console.error("Run did not complete:", run);
    }
  };

  async extractAndSearch(args){

    const argsTojson = JSON.parse(args);
    console.log('######################',argsTojson)
    if(argsTojson.reference_type  == "interne" ||argsTojson.reference_type  == "both" ){
      if(argsTojson.search_type && (argsTojson.search_type == "cours" || argsTojson.search_type == "both")){
        let parms = this.extractCoursParams(argsTojson)
        let cours = await this.searchCours(parms) ; 
        cours = this.transformCoursResponse(cours)
        this.globalSearch.cours = cours
      }
      if(argsTojson.search_type && (argsTojson.search_type == "document" || argsTojson.search_type == "both")){
        let parms = this.extractRessourceParams(argsTojson)
        let ressources = await this.searchRessource(parms) ; 
        ressources = this.transformRessourceResponse(ressources)
        this.globalSearch.ressources = ressources
      }

    }
    if(argsTojson.reference_type  == "externe" ||argsTojson.reference_type  == "both" ){
      if(argsTojson.search_type && (argsTojson.search_type == "cours" || argsTojson.search_type == "both")){
          let m = 'je cherche des cours ' + args ; 
          let result = await this.getAssistantResponse(m)
          this.globalSearch.externalCours =result
      }
      if(argsTojson.search_type && (argsTojson.search_type == "document" || argsTojson.search_type == "both")){
        let m = 'je cherche des documents  ' + args ; 
        let result = await this.getAssistantResponse(m)
        this.globalSearch.externelRessources = result
      }
    }
    return this.globalSearch;
  }


  extractRessourceParams(params){
    let  pars : EsRessource  = new EsRessource(); 
    if(params.query_string){
      pars.query_string = params.query_string;
    }
    if(params.title){
      pars.title = params.title;
    }
    if(params.author){
      pars.auteur = params.author;
    }
    if(params.keyword){
      pars.keyword = params.keyword;
    }
    if(params.editeur){
      pars.editeur = params.editeur;
    }
    if(params.langue){
      pars.langue = params.langue;
    }
    if(params.source){
      pars.source = params.source;
    }
    if(params.niveau){
      pars.level = params.niveau;
    }
    if(params.type){
      pars.type = params.type
    }
    console.log(pars)
    return pars;  
  }
  extractCoursParams(params){
    let  pars : EsCours  = new EsCours();
    if(params.title){
      pars.title = params.title;
    }
    if(params.searchword){
      pars.searchword = params.searchword;
    }
    if(params.langue){
      pars.language = params.langue;
    }
    if(params.provider){
      pars.provider = params.provider;
    }
    if(params.niveau){
      pars.level = params.niveau;
    }
    if(params.query_string){
      pars.query_string = params.query_string;
    }
    if(params.diplomation){
      pars.diplomation = params.diplomation ; 
    }
    return pars;
  }
  transformRessourceResponse(resultRessource: any): any[] {
    return resultRessource.hits.hits.map((hit: any) => {
      const ressourceData = hit._source;
  
      // Extract fields
      const titre = ressourceData?.lom_1_2_title?.[0]?.text || '';
      let coverImage = ressourceData?.lom_1_1_image || '';
      const auteurs = Array.isArray(ressourceData?.lom_2_4_contribute_author)
        ? ressourceData.lom_2_4_contribute_author.map((author: any) => author.entityName).join(', ')
        : '';
      const editeur = Array.isArray(ressourceData?.lom_2_3_contribute)
        ? ressourceData.lom_2_3_contribute.map((editor: any) => editor.value).join(', ')
        : '';
      const anneePublication = ressourceData?.pr_modify_time?.slice(0, 4) || '';
      const resumeDescription = (ressourceData?.lom_1_4_description?.[0]?.text || '').slice(0, 100) + '...';
      const origine = ressourceData?.pr_source || '';
      const languesDocument = Array.isArray(ressourceData?.lom_1_3_language)
        ? ressourceData.lom_1_3_language.join(', ')
        : '';
      const motsCles = Array.isArray(ressourceData?.lom_1_5_keyword)
        ? ressourceData.lom_1_5_keyword.map((keyword: any) => keyword.text).join(', ')
        : '';
      const typeDocumentaire = ressourceData?.lom_1_10_generalresourcetype?.[0] || '';
  
      // Determine the cover image URL based on document type
      try {
        const documentTypeData = Array.isArray(ressourceData?.lom_1_9_documenttype)
          ? ressourceData.lom_1_9_documenttype
          : [];
        if (documentTypeData.length > 0) {
          const typeRessource = documentTypeData[0].value;
          const itemImageFileName = typeRessource.toLowerCase().replace(" ", "-") + '.png';
          coverImage = `/wp-content/plugins/parene/img/resource/${itemImageFileName}`;
        } else {
          coverImage = '/wp-content/plugins/parene/img/resource/collection.png';
        }
      } catch (error) {
        console.error(`Erreur lors de l'analyse de lom_1_9_documentType: ${error}`);
        coverImage = '/wp-content/plugins/parene/img/resource/collection.png';
      }
  
      // Create the resource result object
      return {
        titre,
        auteurs,
        cover_image: coverImage,
        éditeur: editeur,
        "année de publication": anneePublication,
        "résumé-description": resumeDescription,
        source: origine,
        "langues du document": languesDocument,
        "mots-clés": motsCles,
        "type-documentaire": typeDocumentaire,
        "Niveau académique de la ressource": ressourceData?.lom_5_6_context?.[0] || '',
        level: ressourceData?.niveau || '',
        "type-ressource": "document",
        "lien interne vers la ressource parene": `https://www.parene.org/ressources-numeriques/${ressourceData?.parene_resource_lom_id || ''}`,
        source_type: "interne"
      };
    });
  }
  
  transformCoursResponse(coursq: any): any[] {
    return coursq.hits.hits.map((hit: any) => {
      const coursData = hit._source;
  
      return {
        titre: coursData.cdm_cours_2_title?.[0]?.text || '',
        cover_image: coursData.cdm_cours_27_urlimagecourse || '',
        auteurs: (coursData.cdm_cours_a_personne || []).map((person: any) => person.nom_personne).join(', '),
        "année de publication": coursData.cdm_cours_7_1_1_start?.slice(0, 4) || '',
        "résumé-description": (coursData.cdm_cours_5_description?.[0]?.text || '').slice(0, 100) + "...",
        source: coursData.cdm_cours_29_2_nameprovider || '',
        "langues du document": (coursData.cdm_cours_16_instructionlanguage || []).join(', '),
        "mots-clés": (coursData.cdm_cours_26_searchword || []).map((searchword: any) => searchword.text).join(', '),
        "type-ressource": "cours",
        "Niveau académique de la ressource": "",
        "lien interne vers la ressource parene": `https://www.parene.org/nos-formations/cours/${coursData.cdm_cours_1_id || ''}`,
        source_type: "interne"
      };
    });
  }
  async getAssistantResponse(userPrompt) {
    try {
        const response = await this.openai.chat.completions.create({
            model: 'gpt-4',
            messages: [
                {
                    role: 'system',
                    content: `Tu es un assistant qui effectue des recherches sur demande, en fonction des informations fournies par l'utilisateur. 
                              Réponds uniquement avec un texte structuré en Markdown, sans poser de questions ou demander de précisions.
                              Si l'utilisateur mentionne "cours" ou "documents" ainsi que le sujet (par exemple, "mathématiques"), réponds directement en fournissant uniquement des informations pertinentes sur ce sujet.
                              Formatte toujours la réponse en Markdown avec les sections suivantes : "Titre", "Auteurs", "Éditeur", "Année", etc. Utilise des listes à puces pour les détails additionnels lorsque c'est pertinent.
                              Ne pose aucune question et n'attends pas de clarification de la part de l'utilisateur.`,
                },
                {
                    role: 'user',
                    content: userPrompt,
                },
            ],
            temperature: 0.5,
        });

        const assistantReply = response.choices[0].message.content;
        return assistantReply;
    } catch (error) {
        console.error("Error getting assistant response:", error);
    }
}
}
