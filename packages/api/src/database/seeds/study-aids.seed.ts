import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq, sql } from 'drizzle-orm';
import * as schema from '../schema';
import * as dotenv from 'dotenv';

dotenv.config();

interface StudyAidSeedData {
  bookAbbrev: string;
  type: 'summary' | 'key_verse' | 'cross_ref' | 'context';
  content: string;
  metadata: Record<string, unknown>;
}

const seedItems: StudyAidSeedData[] = [
  // --- GÊNESIS ---
  {
    bookAbbrev: 'gn',
    type: 'context',
    content:
      'Gênesis (Bereshit em hebraico, "No princípio") é o livro dos começos: do universo, da humanidade, da família, do pecado, da aliança e do povo escolhido de Deus. Tradicionalmente atribuído a Moisés durante a peregrinação no deserto (séc. XV a.C.), o livro serviu para ensinar a Israel sua verdadeira identidade e o caráter exclusivo de Yahweh frente ao politeísmo pagão do Egito e de Canaã.',
    metadata: {
      author: 'Moisés',
      date: 'Século XV a.C.',
      audience: 'Israel no deserto',
      keyThemes: ['Criação soberana', 'Queda e redenção', 'Eleição e aliança abraâmica'],
    },
  },
  {
    bookAbbrev: 'gn',
    type: 'summary',
    content:
      'A Criação do cosmos em seis dias exegéticos culminando na instituição do Shabat e na criação da humanidade à imagem e semelhança de Deus (Imago Dei). O texto estabelece a soberania de Deus sobre o caos primordial através de Sua Palavra poderosa.',
    metadata: {
      chapterNumber: 1,
      title: 'A Criação do Céu e da Terra',
    },
  },
  {
    bookAbbrev: 'gn',
    type: 'key_verse',
    content: 'No princípio criou Deus os céus e a terra.',
    metadata: {
      chapterNumber: 1,
      verseNumber: 1,
      reference: 'Gênesis 1:1',
      commentary: 'O versículo fundacional de toda a revelação bíblica, afirmando a autoexistência e a soberania criadora de Deus ex nihilo (a partir do nada).',
    },
  },
  {
    bookAbbrev: 'gn',
    type: 'cross_ref',
    content:
      'A criação mediada pela Palavra divina em Gênesis 1 aponta diretamente para o Verbo encarnado (Logos) apresentado no prólogo do Evangelho de João.',
    metadata: {
      chapterNumber: 1,
      verseNumber: 1,
      sourceReference: 'Gênesis 1:1',
      targetBookAbbrev: 'jo',
      targetBookName: 'João',
      targetChapter: 1,
      targetVerse: 1,
      targetReference: 'João 1:1',
    },
  },
  {
    bookAbbrev: 'gn',
    type: 'cross_ref',
    content:
      'A compreensão da criação dos mundos pela fé e pela palavra de Deus conforme destacada pelo autor da Epístola aos Hebreus.',
    metadata: {
      chapterNumber: 1,
      verseNumber: 3,
      sourceReference: 'Gênesis 1:3',
      targetBookAbbrev: 'hb',
      targetBookName: 'Hebreus',
      targetChapter: 11,
      targetVerse: 3,
      targetReference: 'Hebreus 11:3',
    },
  },
  {
    bookAbbrev: 'gn',
    type: 'summary',
    content:
      'A formação minuciosa do homem do pó da terra e o sopro divino de vida (nephesh). O estabelecimento do Jardim do Éden, a proibição de comer da árvore da ciência do bem e do mal, e a criação da mulher, inaugurando a aliança do casamento.',
    metadata: {
      chapterNumber: 2,
      title: 'O Homem no Éden e a Instituição do Casamento',
    },
  },
  {
    bookAbbrev: 'gn',
    type: 'key_verse',
    content: 'Portanto deixará o homem o seu pai e a sua mãe, e apegar-se-á à sua mulher, e serão ambos uma carne.',
    metadata: {
      chapterNumber: 2,
      verseNumber: 24,
      reference: 'Gênesis 2:24',
      commentary: 'O padrão divino original para a aliança matrimonial, citado por Jesus Cristo e pelo apóstolo Paulo como tipo do relacionamento entre Cristo e a Igreja.',
    },
  },
  {
    bookAbbrev: 'gn',
    type: 'cross_ref',
    content:
      'Jesus reafirma a indissolubilidade e a intenção sagrada do casamento baseando-se explicitamente em Gênesis 2:24.',
    metadata: {
      chapterNumber: 2,
      verseNumber: 24,
      sourceReference: 'Gênesis 2:24',
      targetBookAbbrev: 'mt',
      targetBookName: 'Mateus',
      targetChapter: 19,
      targetVerse: 5,
      targetReference: 'Mateus 19:5',
    },
  },
  {
    bookAbbrev: 'gn',
    type: 'summary',
    content:
      'A Queda moral da humanidade: a sedução da serpente, a desobediência de Eva e Adão, a entrada do pecado e da morte no cosmos, e o primeiro anúncio do plano redentor da semente da mulher (Protoevangelho).',
    metadata: {
      chapterNumber: 3,
      title: 'A Queda do Homem e o Protoevangelho',
    },
  },
  {
    bookAbbrev: 'gn',
    type: 'key_verse',
    content: 'E porei inimizade entre ti e a mulher, e entre a tua semente e a sua semente; esta te ferirá a cabeça, e tu lhe ferirás o calcanhar.',
    metadata: {
      chapterNumber: 3,
      verseNumber: 15,
      reference: 'Gênesis 3:15',
      commentary: 'Conhecido historicamente como Protoevangelho, a primeira promessa messiânica da Escritura anunciando o triunfo final de Cristo sobre Satanás.',
    },
  },
  {
    bookAbbrev: 'gn',
    type: 'cross_ref',
    content:
      'O cumprimento da semente da mulher quando Deus enviou Seu Filho, nascido de mulher sob a lei, para redimir os que estavam sob a lei.',
    metadata: {
      chapterNumber: 3,
      verseNumber: 15,
      sourceReference: 'Gênesis 3:15',
      targetBookAbbrev: 'gl',
      targetBookName: 'Gálatas',
      targetChapter: 4,
      targetVerse: 4,
      targetReference: 'Gálatas 4:4',
    },
  },

  // --- ÊXODO ---
  {
    bookAbbrev: 'ex',
    type: 'context',
    content:
      'Êxodo ("Saída" ou "Partida") narra a libertação miraculosa do povo de Deus da escravidão no Egito, a travessia do Mar Vermelho, a outorga da Lei no Monte Sinai e a construção do Tabernáculo, onde a glória do Senhor passa a habitar no meio de Seu povo redimido.',
    metadata: {
      author: 'Moisés',
      date: 'Século XV a.C.',
      keyThemes: ['Redenção por sangue', 'Libertação', 'A Lei da Aliança', 'Presença divina'],
    },
  },
  {
    bookAbbrev: 'ex',
    type: 'summary',
    content:
      'Moisés no monte Horebe pastoreando as ovelhas de Jetro quando se depara com a sarça ardente que não se consumia. Deus se revela pelo Seu Nome memorial eterno: "EU SOU O QUE SOU" e encarrega Moisés da libertação de Israel.',
    metadata: {
      chapterNumber: 3,
      title: 'A Sarça Ardente e a Revelação do Nome Divino',
    },
  },
  {
    bookAbbrev: 'ex',
    type: 'key_verse',
    content: 'E disse Deus a Moisés: EU SOU O QUE SOU. Disse mais: Assim dirás aos filhos de Israel: EU SOU me enviou a vós.',
    metadata: {
      chapterNumber: 3,
      verseNumber: 14,
      reference: 'Êxodo 3:14',
      commentary: 'A revelação do tetragrama sagrado (YHWH), expressando a absoluta autoexistência, soberania e fidelidade eterna de Deus.',
    },
  },
  {
    bookAbbrev: 'ex',
    type: 'cross_ref',
    content:
      'Jesus apropria-se intencionalmente do título divino "EU SOU" perante os líderes religiosos, declarando Sua divindade eterna.',
    metadata: {
      chapterNumber: 3,
      verseNumber: 14,
      sourceReference: 'Êxodo 3:14',
      targetBookAbbrev: 'jo',
      targetBookName: 'João',
      targetChapter: 8,
      targetVerse: 58,
      targetReference: 'João 8:58',
    },
  },

  // --- SALMOS ---
  {
    bookAbbrev: 'sl',
    type: 'context',
    content:
      'O Saltério (Tehilim, "Louvores") é a antologia de orações, hinos de louvor, lamentos e canções litúrgicas de Israel. Composto ao longo de séculos por Davi, Asafe, os filhos de Corá, Moisés e Salomão, ele expressa toda a gama das emoções humanas em comunhão com Deus.',
    metadata: {
      author: 'Davi e outros salmistas',
      structure: 'Cinco livros (Sl 1-41, 42-72, 73-89, 90-106, 107-150)',
      keyThemes: ['O Messias e Seu Reino', 'O justo versus o ímpio', 'Soberania e refúgio na angústia'],
    },
  },
  {
    bookAbbrev: 'sl',
    type: 'summary',
    content:
      'O salmo introdutório ao Saltério compara o destino de dois caminhos: o justo, que medita dia e noite na lei do Senhor e é como árvore frutífera junto às águas, e o ímpio, que é como a palha dispersa pelo vento.',
    metadata: {
      chapterNumber: 1,
      title: 'Os Dois Caminhos: O Justo e o Ímpio',
    },
  },
  {
    bookAbbrev: 'sl',
    type: 'key_verse',
    content: 'Antes tem o seu prazer na lei do Senhor, e na sua lei medita de dia e de noite.',
    metadata: {
      chapterNumber: 1,
      verseNumber: 2,
      reference: 'Salmos 1:2',
      commentary: 'O segredo da vitalidade espiritual duradoura: uma afeição sincera e reflexão contínua sobre os preceitos divinos.',
    },
  },
  {
    bookAbbrev: 'sl',
    type: 'summary',
    content:
      'O hino de confiança mais célebre da história. Davi expressa a suficiência, o cuidado pastoral, a proteção no vale da sombra da morte e a certeza da bondade e misericórdia do Senhor por todos os dias da vida.',
    metadata: {
      chapterNumber: 23,
      title: 'O Senhor é o Meu Pastor',
    },
  },
  {
    bookAbbrev: 'sl',
    type: 'key_verse',
    content: 'O SENHOR é o meu pastor, nada me faltará.',
    metadata: {
      chapterNumber: 23,
      verseNumber: 1,
      reference: 'Salmos 23:1',
      commentary: 'Afirmação completa de dependência e contentamento no cuidado benevolente do Grande Pastor.',
    },
  },
  {
    bookAbbrev: 'sl',
    type: 'cross_ref',
    content:
      'Jesus identifica-se como o cumprimento pleno do Bom Pastor que dá a Sua vida pelas Suas ovelhas.',
    metadata: {
      chapterNumber: 23,
      verseNumber: 1,
      sourceReference: 'Salmos 23:1',
      targetBookAbbrev: 'jo',
      targetBookName: 'João',
      targetChapter: 10,
      targetVerse: 11,
      targetReference: 'João 10:11',
    },
  },

  // --- ISAÍAS ---
  {
    bookAbbrev: 'is',
    type: 'context',
    content:
      'Frequentemente chamado de "O Quinto Evangelho", Isaías profetizou em Judá durante os reinados de Uzias, Jotão, Acaz e Ezequias. O livro contrasta o julgamento severo contra a idolatria com promessas indescritíveis de restauração, salvação universal e a figura gloriosa do Servo Sofredor.',
    metadata: {
      author: 'Profeta Isaías',
      date: 'Século VIII a.C.',
      keyThemes: ['Santidade de Deus', 'Juízo e remanescente', 'O Servo do Senhor', 'A nova criação'],
    },
  },
  {
    bookAbbrev: 'is',
    type: 'summary',
    content:
      'O ápice profético do Quarto Cântico do Servo: a descrição minuciosa dos sofrimentos vicários, da expiação penal substitutiva e da justificação de muitos pela obediência do Servo ferido por Deus.',
    metadata: {
      chapterNumber: 53,
      title: 'O Servo Sofredor e a Expiação Substitutiva',
    },
  },
  {
    bookAbbrev: 'is',
    type: 'key_verse',
    content: 'Mas ele foi ferido por causa das nossas transgressões, e moído por causa das nossas iniquidades; o castigo que nos traz a paz estava sobre ele, e pelas suas pisaduras fomos sarados.',
    metadata: {
      chapterNumber: 53,
      verseNumber: 5,
      reference: 'Isaías 53:5',
      commentary: 'A definição teológica mais cristalina do sacrifício substitutivo em todo o Antigo Testamento.',
    },
  },
  {
    bookAbbrev: 'is',
    type: 'cross_ref',
    content:
      'O apóstolo Pedro aplica literalmente Isaías 53 à crucificação e sofrimento vicário de Jesus Cristo.',
    metadata: {
      chapterNumber: 53,
      verseNumber: 5,
      sourceReference: 'Isaías 53:5',
      targetBookAbbrev: '1pe',
      targetBookName: '1 Pedro',
      targetChapter: 2,
      targetVerse: 24,
      targetReference: '1 Pedro 2:24',
    },
  },

  // --- JOÃO ---
  {
    bookAbbrev: 'jo',
    type: 'context',
    content:
      'O Evangelho segundo João foi redigido pelo discípulo a quem Jesus amava. Seu propósito explícito (Jo 20:31) é apologético e evangelístico: demonstrar através de sete sinais milagrosos e discursos profundos que Jesus é o Cristo, o Filho de Deus, para que crendo tenhamos vida em Seu nome.',
    metadata: {
      author: 'Apóstolo João',
      date: 'Final do século I (aprox. 85-95 d.C.)',
      keyThemes: ['Encarnação do Logos', 'Sinais e glória', 'Vida eterna através da fé', 'A promessa do Paráclito'],
    },
  },
  {
    bookAbbrev: 'jo',
    type: 'summary',
    content:
      'O Prólogo majestoso de João apresenta a pré-existência, a divindade e a encarnação do Verbo (Logos). Segue-se o testemunho público de João Batista e o chamado dos primeiros discípulos de Jesus.',
    metadata: {
      chapterNumber: 1,
      title: 'O Verbo se Fez Carne e os Primeiros Discípulos',
    },
  },
  {
    bookAbbrev: 'jo',
    type: 'key_verse',
    content: 'E o Verbo se fez carne, e habitou entre nós, e vimos a sua glória, como a glória do unigênito do Pai, cheio de graça e de verdade.',
    metadata: {
      chapterNumber: 1,
      verseNumber: 14,
      reference: 'João 1:14',
      commentary: 'O ápice teológico da Encarnação: o Criador do universo assume a natureza humana sem deixar de ser Deus para habitar (tabernacular) com a humanidade.',
    },
  },
  {
    bookAbbrev: 'jo',
    type: 'summary',
    content:
      'O encontro noturno de Jesus com Nicodemos sobre a necessidade do novo nascimento pelo Espírito Santo, seguido pela declaração suprema do amor gracioso de Deus em dar Seu Filho Unigênito para salvar o mundo.',
    metadata: {
      chapterNumber: 3,
      title: 'O Novo Nascimento e o Amor Redentor de Deus',
    },
  },
  {
    bookAbbrev: 'jo',
    type: 'key_verse',
    content: 'Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.',
    metadata: {
      chapterNumber: 3,
      verseNumber: 16,
      reference: 'João 3:16',
      commentary: 'Conhecido universalmente como o "versículo de ouro" do Novo Testamento, resumindo a fonte (o amor do Pai), o custo (Seu Filho) e o benefício (vida eterna).',
    },
  },

  // --- ROMANOS ---
  {
    bookAbbrev: 'rm',
    type: 'context',
    content:
      'A Epístola aos Romanos é a magnum opus teológica de Paulo. Escrita de Corinto por volta de 57 d.C., a carta articula com clareza incomparável o evangelho da justiça de Deus concedida mediante a fé em Jesus Cristo a todo o que crê, tanto judeus como gentios.',
    metadata: {
      author: 'Apóstolo Paulo',
      date: 'Aprox. 57 d.C.',
      keyThemes: ['Universalidade do pecado', 'Justificação somente pela fé (Sola Fide)', 'Santificação', 'A soberania de Deus'],
    },
  },
  {
    bookAbbrev: 'rm',
    type: 'summary',
    content:
      'O capítulo do clímax da santificação e da segurança eterna dos crentes. Paulo declara que não há condenação para os que estão em Cristo, descreve a obra intercessora do Espírito Santo e conclui com o inabalável amor de Deus que nada pode nos separar.',
    metadata: {
      chapterNumber: 8,
      title: 'Vida no Espírito e Segurança Inabalável em Cristo',
    },
  },
  {
    bookAbbrev: 'rm',
    type: 'key_verse',
    content: 'Portanto, agora nenhuma condenação há para os que estão em Cristo Jesus, que não andam segundo a carne, mas segundo o Espírito.',
    metadata: {
      chapterNumber: 8,
      verseNumber: 1,
      reference: 'Romanos 8:1',
      commentary: 'A proclamação definitiva da justificação legal perante o tribunal divino garantida pelo sacrifício de Cristo.',
    },
  },
  {
    bookAbbrev: 'rm',
    type: 'key_verse',
    content: 'E sabemos que todas as coisas contribuem juntamente para o bem daqueles que amam a Deus, daqueles que são chamados segundo o seu propósito.',
    metadata: {
      chapterNumber: 8,
      verseNumber: 28,
      reference: 'Romanos 8:28',
      commentary: 'A providência benevolente de Deus que orquestra todos os eventos para a conformidade dos eleitos à imagem de Seu Filho.',
    },
  },
];

export async function seedStudyAids() {
  console.log('📚 Starting Study Aids database seed...');

  const connectionString =
    process.env.DATABASE_URL || 'postgresql://biblia_app:biblia@localhost:5434/biblia';
  const client = postgres(connectionString);
  const db = drizzle(client, { schema });

  let insertedCount = 0;

  for (const item of seedItems) {
    const [book] = await db
      .select({ id: schema.books.id, name: schema.books.name })
      .from(schema.books)
      .where(sql`lower(${schema.books.abbrev}) = lower(${item.bookAbbrev})`)
      .limit(1);

    if (!book) {
      console.warn(`Book abbrev '${item.bookAbbrev}' not found, skipping.`);
      continue;
    }

    await db.insert(schema.studyAids).values({
      bookId: book.id,
      type: item.type,
      content: item.content,
      metadata: item.metadata,
    });

    insertedCount++;
  }

  console.log(`✅ Successfully seeded ${insertedCount} study aids!`);
  await client.end();
}

if (require.main === module) {
  seedStudyAids()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Failed to seed study aids:', err);
      process.exit(1);
    });
}
