import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import {
  ChapterAnalysisResult,
  BookReflectionResult,
} from '../interfaces/ai-analysis.interface';

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private aiClient: GoogleGenAI | null = null;
  private readonly modelName = 'gemini-2.5-flash';

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (apiKey && apiKey !== 'your-api-key-here' && apiKey !== 'test') {
      try {
        this.aiClient = new GoogleGenAI({ apiKey });
        this.logger.log('Google GenAI SDK inicializado com sucesso.');
      } catch (err) {
        this.logger.warn(`Falha ao inicializar Google GenAI SDK: ${err}`);
      }
    } else {
      this.logger.warn('GEMINI_API_KEY não configurada. Usando gerador hermenêutico de fallback.');
    }
  }

  async generateChapterAnalysis(
    bookName: string,
    chapterNumber: number,
    versesText: string,
  ): Promise<ChapterAnalysisResult> {
    const prompt = `Você é um erudito teólogo e comentarista bíblico especializado em exegese histórico-gramatical, teologia bíblica e aplicação pastoral.
Analise detalhadamente o capítulo ${bookName} ${chapterNumber}.
O texto dos versículos é o seguinte:
${versesText}

Retorne ESTRITAMENTE um objeto JSON válido (sem tags markdown adicionais fora do JSON) com a seguinte estrutura em português:
{
  "bookName": "${bookName}",
  "chapterNumber": ${chapterNumber},
  "title": "Título exegético e descritivo para o capítulo",
  "summary": "Resumo analítico claro e profundo dos principais acontecimentos e mensagem do capítulo (2 a 3 parágrafos)",
  "historicalContext": "Contexto histórico, geográfico, cultural e propósito original do autor no período em que foi escrito",
  "keyThemes": ["Tema Teológico 1", "Tema Teológico 2", "Tema Teológico 3", "Tema Teológico 4"],
  "literaryStructure": [
    {
      "section": "Título da subdivisão",
      "verses": "Intervalo (ex: 1-5)",
      "description": "Explicação do que ocorre nesta perícope"
    }
  ],
  "practicalApplication": [
    "Aplicação prática para a vida diária e espiritual 1",
    "Aplicação prática para a vida diária e espiritual 2",
    "Aplicação prática para a vida diária e espiritual 3"
  ],
  "theologicalInsights": "Reflexão teológica aprofundada conectando a passagem ao plano da redenção divina e implicações doutrinárias."
}`;

    if (this.aiClient) {
      try {
        const response = await this.aiClient.models.generateContent({
          model: this.modelName,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });

        const rawText = response.text || '';
        const cleanedJson = this.cleanJsonOutput(rawText);
        return JSON.parse(cleanedJson) as ChapterAnalysisResult;
      } catch (error) {
        this.logger.error(`Erro ao consultar Gemini para ${bookName} ${chapterNumber}: ${error}`);
      }
    }

    return this.getFallbackChapterAnalysis(bookName, chapterNumber);
  }

  async generateBookReflection(
    bookName: string,
    testament: 'OT' | 'NT',
  ): Promise<BookReflectionResult> {
    const prompt = `Você é um erudito teólogo bíblico. Forneça uma reflexão abrangente e introdução teológica aprofundada para o livro bíblico de ${bookName} (${testament === 'OT' ? 'Antigo Testamento' : 'Novo Testamento'}).

Retorne ESTRITAMENTE um objeto JSON válido (sem tags markdown adicionais fora do JSON) com a seguinte estrutura em português:
{
  "bookName": "${bookName}",
  "testament": "${testament}",
  "author": "Autor tradicional e acadêmico do livro",
  "dateAndContext": "Data estimada de composição e conjuntura histórica da época",
  "purpose": "Propósito central pelo qual o livro foi escrito e seu público-alvo original",
  "centralTheme": "A grande mensagem teológica e fio condutor de todo o livro",
  "structureOutline": [
    {
      "section": "Título da parte",
      "chapters": "Capítulos (ex: 1-11)",
      "summary": "Resumo do conteúdo desta seção"
    }
  ],
  "keyVerses": [
    {
      "reference": "${bookName} X:Y",
      "text": "Texto do versículo chave",
      "commentary": "Por que este versículo resume o coração do livro"
    }
  ],
  "christologicalSignificance": "Como o livro aponta para Cristo, prenuncia o Messias ou expande a revelação do Evangelho."
}`;

    if (this.aiClient) {
      try {
        const response = await this.aiClient.models.generateContent({
          model: this.modelName,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });

        const rawText = response.text || '';
        const cleanedJson = this.cleanJsonOutput(rawText);
        return JSON.parse(cleanedJson) as BookReflectionResult;
      } catch (error) {
        this.logger.error(`Erro ao consultar Gemini para reflexão de ${bookName}: ${error}`);
      }
    }

    return this.getFallbackBookReflection(bookName, testament);
  }

  private cleanJsonOutput(text: string): string {
    let cleaned = text.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.substring(7);
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.substring(3);
    }
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.substring(0, cleaned.length - 3);
    }
    return cleaned.trim();
  }

  private getFallbackChapterAnalysis(
    bookName: string,
    chapterNumber: number,
  ): ChapterAnalysisResult {
    return {
      bookName,
      chapterNumber,
      title: `${bookName} ${chapterNumber} — Exegese e Mensagem Teológica`,
      summary: `O capítulo ${chapterNumber} de ${bookName} apresenta lições fundamentais no desenvolvimento da narrativa bíblica. A passagem articula a fidelidade do Senhor à Sua aliança, revelando verdades perenes sobre o caráter de Deus e Seu relacionamento com a humanidade em momentos decisivos de fé, provação e redenção.`,
      historicalContext: `Escrito dentro do contexto do povo da aliança, ${bookName} situa os leitores diante da soberania divina e do chamado à santidade em meio aos desafios socioculturais do Antigo Oriente Próximo ou da era Greco-Romana.`,
      keyThemes: [
        'Soberania e Fidelidade de Deus',
        'Aliança e Obediência',
        'Graça e Redenção',
        'Transformação do Caráter',
      ],
      literaryStructure: [
        {
          section: 'Abertura e Introdução do Cenário',
          verses: 'Início do capítulo',
          description: 'Apresentação do contexto, dos personagens envolvidos e do conflito ou diálogo central.',
        },
        {
          section: 'Desenvolvimento e Clímax Narrativo/Doutrinário',
          verses: 'Meio do capítulo',
          description: 'A manifestação da palavra ou ação divina que direciona o coração dos participantes.',
        },
        {
          section: 'Conclusão e Implicações Duradouras',
          verses: 'Fim do capítulo',
          description: 'O desfecho que consolida os preceitos e convoca os ouvintes a uma resposta de fé.',
        },
      ],
      practicalApplication: [
        'Confiar na direção soberana de Deus mesmo diante de circunstâncias adversas.',
        'Praticar o exame diário das Escrituras para alinhar decisões pessoais aos princípios do Reino.',
        'Desenvolver uma vida de oração constante alicerçada na graça e santidade do Senhor.',
      ],
      theologicalInsights: `Este capítulo antecipa e reforça a grande linha salvífica da Escritura. Cada mandamento, vitória ou exortação aponta em última instância para a suficiência da redenção divina e para a restauração completa de todas as coisas em Cristo.`,
    };
  }

  private getFallbackBookReflection(
    bookName: string,
    testament: 'OT' | 'NT',
  ): BookReflectionResult {
    return {
      bookName,
      testament,
      author: testament === 'OT' ? 'Profetas e sábios do cânon hebraico' : 'Apóstolos e discípulos de Cristo',
      dateAndContext: 'Composto sob a inspiração do Espírito Santo no contexto histórico da revelação divina progressiva.',
      purpose: `Instruir, edificar e consolar a comunidade dos fiéis em ${bookName}, revelando os caminhos da justiça, misericórdia e vida eterna.`,
      centralTheme: `A revelação progressiva da glória e soberania de Deus no governo da história e salvação de Seu povo em ${bookName}.`,
      structureOutline: [
        {
          section: 'Fundamentos e Chamado Inicial',
          chapters: 'Capítulos iniciais',
          summary: 'Estabelecimento das bases históricas, teológicas e dos temas centrais do livro.',
        },
        {
          section: 'Jornada, Doutrina e Exortações',
          chapters: 'Corpo central do livro',
          summary: 'Desenvolvimento exegético dos ensinamentos, leis, profecias ou narrativas históricas.',
        },
        {
          section: 'Promessas Futuras e Esperança Escatológica',
          chapters: 'Capítulos finais',
          summary: 'Culminação nas promessas da fidelidade perpétua de Deus e salvação para todas as gerações.',
        },
      ],
      keyVerses: [
        {
          reference: `${bookName} 1:1`,
          text: 'O princípio da mensagem transmitida aos santos.',
          commentary: 'Sintetiza o coração teológico e a proclamação da soberania de Deus sobre a história humana.',
        },
      ],
      christologicalSignificance: `Como toda a revelação das Escrituras Sagradas, o livro de ${bookName} converge organicamente para a pessoa, obra, ressurreição e reinado universal de Jesus Cristo.`,
    };
  }
}
