import type { PoliticalCompassQuestion, PoliticalCompassPage } from "./types.js";

export const POLITICAL_COMPASS_PAGES: PoliticalCompassPage[] = [
  { page: 1, title: "Globalização e Nação", questionIds: [0, 1, 2, 3, 4, 5, 6] },
  { page: 2, title: "Economia", questionIds: [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20] },
  { page: 3, title: "Valores Pessoais e Sociais", questionIds: [21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38] },
  { page: 4, title: "Sociedade e Estado", questionIds: [39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50] },
  { page: 5, title: "Religião e Moralidade", questionIds: [51, 52, 53, 54, 55] },
  { page: 6, title: "Sexualidade e Liberdade Pessoal", questionIds: [56, 57, 58, 59, 60, 61] },
];

export const POLITICAL_COMPASS_QUESTIONS: PoliticalCompassQuestion[] = [
  // Page 1: Globalização e Nação
  { id: 0, page: 1, text: "Se a globalização econômica é inevitável, ela deve servir em primeiro lugar à humanidade, em vez de servir aos interesses das corporações transnacionais.", scoring: { economic: [7, 5, 0, -2], social: [0, 0, 0, 0] }, affects: "economic" },
  { id: 1, page: 1, text: "Eu sempre apoiaria o meu país, não importa se estivesse certo ou errado.", scoring: { economic: [0, 0, 0, 0], social: [-8, -6, 0, 2] }, affects: "social" },
  { id: 2, page: 1, text: "Ninguém escolheu nascer em seu país, portanto, é tolice ter orgulho disso.", scoring: { economic: [0, 0, 0, 0], social: [7, 5, 0, -2] }, affects: "social" },
  { id: 3, page: 1, text: "Nossa raça tem muitas qualidades superiores em comparação com outras raças.", scoring: { economic: [0, 0, 0, 0], social: [-7, -5, 0, 2] }, affects: "social" },
  { id: 4, page: 1, text: "O inimigo do meu inimigo é meu amigo.", scoring: { economic: [0, 0, 0, 0], social: [-7, -5, 0, 2] }, affects: "social" },
  { id: 5, page: 1, text: "Ações militares que contrariam a legislação internacional às vezes são justificadas.", scoring: { economic: [0, 0, 0, 0], social: [-6, -4, 0, 2] }, affects: "social" },
  { id: 6, page: 1, text: "Existe atualmente uma fusão preocupante de informação e entretenimento.", scoring: { economic: [0, 0, 0, 0], social: [7, 5, 0, -2] }, affects: "social" },

  // Page 2: Economia
  { id: 7, page: 2, text: "Ultimamente, as pessoas estão divididas mais por classes do que por nacionalidades.", scoring: { economic: [7, 5, 0, -2], social: [0, 0, 0, 0] }, affects: "economic" },
  { id: 8, page: 2, text: "Controlar a inflação é mais importante do que controlar o desemprego.", scoring: { economic: [-7, -5, 0, 2], social: [0, 0, 0, 0] }, affects: "economic" },
  { id: 9, page: 2, text: "Porque não se pode confiar nas corporações para proteger voluntariamente o meio ambiente, elas precisam de regulação.", scoring: { economic: [6, 4, 0, -2], social: [0, 0, 0, 0] }, affects: "economic" },
  { id: 10, page: 2, text: "\"De cada qual segundo sua capacidade, a cada qual segundo suas necessidades\" é, fundamentalmente, uma boa idéia.", scoring: { economic: [7, 5, 0, -2], social: [0, 0, 0, 0] }, affects: "economic" },
  { id: 11, page: 2, text: "Quanto mais livre é o mercado, mais livres são as pessoas.", scoring: { economic: [-8, -6, 0, 2], social: [0, 0, 0, 0] }, affects: "economic" },
  { id: 12, page: 2, text: "É um triste reflexo de nossa sociedade que algo tão básico quanto a água potável tenha sido transformado em produto para consumo engarrafado e de marca.", scoring: { economic: [8, 6, 0, -2], social: [0, 0, 0, 0] }, affects: "economic" },
  { id: 13, page: 2, text: "A terra não deveria ser uma mercadoria para ser comprada e vendida.", scoring: { economic: [8, 6, 0, -1], social: [0, 0, 0, 0] }, affects: "economic" },
  { id: 14, page: 2, text: "É lamentável que tantas fortunas pessoais sejam acumuladas por pessoas que simplesmente manipulam dinheiro e não contribuem em nada para a sociedade.", scoring: { economic: [7, 5, 0, -3], social: [0, 0, 0, 0] }, affects: "economic" },
  { id: 15, page: 2, text: "O protecionismo às vezes é necessário no comércio.", scoring: { economic: [8, 6, 0, -1], social: [0, 0, 0, 0] }, affects: "economic" },
  { id: 16, page: 2, text: "A única responsabilidade social de uma empresa deveria ser oferecer lucro para seus acionistas.", scoring: { economic: [-7, -5, 0, 2], social: [0, 0, 0, 0] }, affects: "economic" },
  { id: 17, page: 2, text: "Os ricos pagam muitos impostos.", scoring: { economic: [-7, -5, 0, 1], social: [0, 0, 0, 0] }, affects: "economic" },
  { id: 18, page: 2, text: "Aqueles que podem pagar mais devem ter o direito de receber tratamento médico melhor.", scoring: { economic: [-6, -4, 0, 2], social: [0, 0, 0, 0] }, affects: "economic" },
  { id: 19, page: 2, text: "O governo deveria penalizar as empresas que enganam os consumidores.", scoring: { economic: [6, 4, 0, -1], social: [0, 0, 0, 0] }, affects: "economic" },
  { id: 20, page: 2, text: "O verdadeiro livre mercado requer restrições à habilidade que as multinacionais predadoras têm para criar monopólios.", scoring: { economic: [0, 0, 0, 0], social: [0, 0, 0, 0] }, affects: "none" },

  // Page 3: Valores Pessoais e Sociais
  { id: 21, page: 3, text: "O aborto, nos casos em que a vida da mulher não está ameaçada, deve ser sempre ilegal.", scoring: { economic: [0, 0, 0, 0], social: [-6, -4, 0, 2] }, affects: "social" },
  { id: 22, page: 3, text: "Toda a autoridade deve ser questionada.", scoring: { economic: [0, 0, 0, 0], social: [7, 6, 0, -2] }, affects: "social" },
  { id: 23, page: 3, text: "Olho por olho e dente por dente.", scoring: { economic: [0, 0, 0, 0], social: [-5, -4, 0, 2] }, affects: "social" },
  { id: 24, page: 3, text: "Os contribuintes não devem sustentar quaisquer teatros ou museus que não conseguiriam se manter em uma base comercial.", scoring: { economic: [-8, -6, 0, 1], social: [0, 0, 0, 0] }, affects: "economic" },
  { id: 25, page: 3, text: "Nas escolas, a frequência às aulas não deveria ser obrigatória.", scoring: { economic: [0, 0, 0, 0], social: [8, 4, 0, -2] }, affects: "social" },
  { id: 26, page: 3, text: "Todas as pessoas têm seus direitos, mas é melhor para todos que diferentes tipos de pessoas não se misturem.", scoring: { economic: [0, 0, 0, 0], social: [-7, -5, 0, 2] }, affects: "social" },
  { id: 27, page: 3, text: "Às vezes, os bons pais têm que bater nos seus filhos.", scoring: { economic: [0, 0, 0, 0], social: [-7, -5, 0, 3] }, affects: "social" },
  { id: 28, page: 3, text: "É natural que as crianças guardem alguns segredos de seus pais.", scoring: { economic: [0, 0, 0, 0], social: [6, 4, 0, -3] }, affects: "social" },
  { id: 29, page: 3, text: "A posse de maconha para uso pessoal não deve ser considerada um crime.", scoring: { economic: [0, 0, 0, 0], social: [6, 3, 0, -2] }, affects: "social" },
  { id: 30, page: 3, text: "A primeira função da educação escolar deve ser preparar a próxima geração para conseguir empregos.", scoring: { economic: [0, 0, 0, 0], social: [-7, -5, 0, 3] }, affects: "social" },
  { id: 31, page: 3, text: "Pessoas com graves deficiências hereditárias não devem ter permissão para reproduzir.", scoring: { economic: [0, 0, 0, 0], social: [-9, -7, 0, 2] }, affects: "social" },
  { id: 32, page: 3, text: "A coisa mais importante que as crianças devem aprender é a aceitar a disciplina.", scoring: { economic: [0, 0, 0, 0], social: [-8, -6, 0, 2] }, affects: "social" },
  { id: 33, page: 3, text: "Não existem pessoas selvagens e pessoas civilizadas; existem apenas culturas diferentes.", scoring: { economic: [0, 0, 0, 0], social: [7, 6, 0, -2] }, affects: "social" },
  { id: 34, page: 3, text: "Aqueles que são capazes de trabalhar, mas recusam a oportunidade, não devem esperar o apoio da sociedade.", scoring: { economic: [0, 0, 0, 0], social: [-7, -5, 0, 2] }, affects: "social" },
  { id: 35, page: 3, text: "Quando você está com problemas, é melhor não pensar sobre isso, mas se manter ocupado com coisas mais alegres.", scoring: { economic: [0, 0, 0, 0], social: [-6, -4, 0, 2] }, affects: "social" },
  { id: 36, page: 3, text: "A primeira geração de imigrantes nunca estará plenamente integrada em seu novo país.", scoring: { economic: [0, 0, 0, 0], social: [-7, -4, 0, 2] }, affects: "social" },
  { id: 37, page: 3, text: "O que é bom para as corporações mais bem sucedidas é sempre, em última instância, bom para todos nós.", scoring: { economic: [-10, -8, 0, 1], social: [0, 0, 0, 0] }, affects: "economic" },
  { id: 38, page: 3, text: "Nenhum meio de comunicação, não importa o quão independente seja seu conteúdo, deve receber financiamento público.", scoring: { economic: [-5, -4, 0, 1], social: [0, 0, 0, 0] }, affects: "economic" },

  // Page 4: Sociedade e Estado
  { id: 39, page: 4, text: "Nossas liberdades civis estão sendo excessivamente reduzidas em nome da luta contra o terrorismo.", scoring: { economic: [0, 0, 0, 0], social: [7, 5, 0, -3] }, affects: "social" },
  { id: 40, page: 4, text: "Uma vantagem significativa de um estado com apenas um único partido político é que ele evita todos os debates que atrasam o progresso em um sistema político democrático.", scoring: { economic: [0, 0, 0, 0], social: [-9, -6, 0, 2] }, affects: "social" },
  { id: 41, page: 4, text: "Embora a era eletrônica tenha tornado a vigilância mais fácil, apenas malfeitores precisam ficar preocupados.", scoring: { economic: [0, 0, 0, 0], social: [-8, -6, 0, 2] }, affects: "social" },
  { id: 42, page: 4, text: "A pena de morte deveria ser uma opção para os crimes mais sérios.", scoring: { economic: [0, 0, 0, 0], social: [-8, -6, 0, 2] }, affects: "social" },
  { id: 43, page: 4, text: "Em uma sociedade civilizada, deve sempre haver pessoas acima, para serem obedecidas, e pessoas abaixo, para serem comandadas.", scoring: { economic: [0, 0, 0, 0], social: [-6, -4, 0, 2] }, affects: "social" },
  { id: 44, page: 4, text: "A arte abstrata que não representa nada não deve ser considerada arte.", scoring: { economic: [0, 0, 0, 0], social: [-8, -6, 0, 2] }, affects: "social" },
  { id: 45, page: 4, text: "Na justiça criminal, a punição deve ser mais importante do que a reabilitação.", scoring: { economic: [0, 0, 0, 0], social: [-7, -5, 0, 2] }, affects: "social" },
  { id: 46, page: 4, text: "É perda de tempo tentar reabilitar certos criminosos.", scoring: { economic: [0, 0, 0, 0], social: [-8, -6, 0, 2] }, affects: "social" },
  { id: 47, page: 4, text: "O homem de negócios e o fabricante são mais importantes do que o escritor e o artista.", scoring: { economic: [0, 0, 0, 0], social: [-5, -3, 0, 2] }, affects: "social" },
  { id: 48, page: 4, text: "As mães podem ter carreiras profissionais, mas seu principal dever é o de ser donas de casa.", scoring: { economic: [0, 0, 0, 0], social: [-7, -5, 0, 2] }, affects: "social" },
  { id: 49, page: 4, text: "As companhias multinacionais estão, de maneira antiética, explorando os recursos genéticos vegetais em países em desenvolvimento.", scoring: { economic: [0, 0, 0, 0], social: [7, 5, 0, -2] }, affects: "social" },
  { id: 50, page: 4, text: "Estar em paz com o establishment é um importante aspecto de maturidade.", scoring: { economic: [0, 0, 0, 0], social: [-6, -4, 0, 2] }, affects: "social" },

  // Page 5: Religião e Moralidade
  { id: 51, page: 5, text: "A astrologia explica muitas coisas de forma precisa.", scoring: { economic: [0, 0, 0, 0], social: [-7, -5, 0, 2] }, affects: "social" },
  { id: 52, page: 5, text: "É impossível ser moral sem ser religioso.", scoring: { economic: [-9, -8, 0, 1], social: [-6, -4, 0, 2] }, affects: "both" },
  { id: 53, page: 5, text: "A caridade é melhor do que a seguridade social como um modo de ajudar as pessoas que são verdadeiramente desfavorecidas.", scoring: { economic: [0, 0, 0, 0], social: [0, 0, 0, 0] }, affects: "none" },
  { id: 54, page: 5, text: "Algumas pessoas são naturalmente azaradas.", scoring: { economic: [0, 0, 0, 0], social: [-7, -5, 0, 2] }, affects: "social" },
  { id: 55, page: 5, text: "É importante que a escola de meu filho incuta valores religiosos.", scoring: { economic: [0, 0, 0, 0], social: [-6, -4, 0, 2] }, affects: "social" },

  // Page 6: Sexualidade e Liberdade Pessoal
  { id: 56, page: 6, text: "Sexo fora do casamento é imoral.", scoring: { economic: [0, 0, 0, 0], social: [-7, -6, 0, 2] }, affects: "social" },
  { id: 57, page: 6, text: "Um casal do mesmo sexo em uma relação amorosa estável não deveria ser excluído da possibilidade de adotar uma criança.", scoring: { economic: [0, 0, 0, 0], social: [7, 6, 0, -2] }, affects: "social" },
  { id: 58, page: 6, text: "A pornografia que mostra adultos com seu consentimento deve ser legal para a população adulta.", scoring: { economic: [0, 0, 0, 0], social: [7, 5, 0, -2] }, affects: "social" },
  { id: 59, page: 6, text: "O que acontece em um quarto particular entre adultos com consentimento não é da conta do Estado.", scoring: { economic: [0, 0, 0, 0], social: [8, 6, 0, -2] }, affects: "social" },
  { id: 60, page: 6, text: "Ninguém pode se sentir naturalmente homossexual.", scoring: { economic: [0, 0, 0, 0], social: [-8, -6, 0, 2] }, affects: "social" },
  { id: 61, page: 6, text: "Atualmente, a abertura sobre o sexo já foi longe demais.", scoring: { economic: [0, 0, 0, 0], social: [-6, -4, 0, 2] }, affects: "social" },
];
