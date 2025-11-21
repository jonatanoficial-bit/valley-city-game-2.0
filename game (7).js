// ===========================
// ESTADO GLOBAL DO JOGO
// ===========================

let selectedAvatar = "";
let playerName = "";
let currentCaseIndex = 0;
let currentCase = null;

let casesData = [];
let casesLoaded = false;

const gameState = {
  prestige: 50,
  moral: 50,
  reputation: 50,
  solved: 0,
  errors: 0,
  agency: "police" // pode ser "police", "FBI" ou "CIA"
  ,
  // pontuação geral (ranking) calculada a partir das estatísticas
  rank: 50,
  // pontuação geral (score) usada para promoções adicionais
  score: 50
};

// ===========================
// INTRODUÇÃO – SLIDES COM IMAGENS
// Lista de imagens que serão mostradas na introdução.
// Ajuste estes nomes conforme as imagens existentes na pasta assets.
// A sequência de imagens de introdução. Inclui a capa principal, cenas de crime,
// avatares de policiais, suspeitos, testemunhas e algumas provas. Se novas
// imagens forem adicionadas à pasta `assets`, basta incluir seus nomes aqui.
const introImages = [
  // capa principal e cenas de crime
  "capa_principal.png",
  "crime_scene_01.png",
  "crime_scene_02.png",
  "crime_scene_03.png",
  "case_scene_bg.png",
  // avatares (01 a 10)
  "avatar_01.png", "avatar_02.png", "avatar_03.png", "avatar_04.png", "avatar_05.png", 
  "avatar_06.png", "avatar_07.png", "avatar_08.png", "avatar_09.png", "avatar_10.png",
  // suspeitos (01 a 12)
  "suspect_01.png", "suspect_02.png", "suspect_03.png", "suspect_04.png", "suspect_05.png", 
  "suspect_06.png", "suspect_07.png", "suspect_08.png", "suspect_09.png", "suspect_10.png", 
  "suspect_11.png", "suspect_12.png",
  // testemunhas (01 a 22)
  "witness_01.png", "witness_02.png", "witness_03.png", "witness_04.png", "witness_05.png", 
  "witness_06.png", "witness_07.png", "witness_08.png", "witness_09.png", "witness_10.png", 
  "witness_11.png", "witness_12.png", "witness_13.png", "witness_14.png", "witness_15.png", 
  "witness_16.png", "witness_17.png", "witness_18.png", "witness_19.png", "witness_20.png", 
  "witness_21.png", "witness_22.png",
  // alguns tipos de provas para compor a sequência (objetos, armas, textos e documentos)
  "evidence_obj_01.png", "evidence_obj_02.png", "evidence_obj_03.png", 
  "evidence_weapon_01.png", "evidence_weapon_02.png", 
  "evidence_text_01.png", 
  "evidence_doc_01.png", "evidence_doc_02.png"
];
let introIndex = 0;
let introInterval = null;

// ===========================
// QUESTIONÁRIOS PARA TESTEMUNHAS E SUSPEITOS
// Define conjuntos básicos de perguntas e respostas. Podem ser expandidos
// conforme necessário para cada arquivo específico.
const witnessQuestions = {
  default: [
    { q: "O que você viu?", a: "Eu vi uma pessoa correndo da cena do crime." },
    { q: "Você conhece a vítima?", a: "Apenas de vista, não tínhamos relação próxima." },
    { q: "Você notou algo suspeito?", a: "Havia um carro escuro estacionado sem placas." }
  ]
};

const suspectQuestions = {
  default: [
    { q: "Onde você estava na hora do crime?", a: "Estava em casa sozinho, assistindo TV." },
    { q: "Conhecia a vítima?", a: "Sim, éramos colegas de trabalho." },
    { q: "Por que alguém suspeitaria de você?", a: "Porque discutimos recentemente, mas eu não faria isso." }
  ]
};

// Variáveis para acompanhar interrogatórios
let currentWitness = null;
let witnessMood = 100;
let currentSuspect = null;
let suspectMood = 100;

// Variáveis para exame de promoção
let selectedAgency = "";
let examQuestions = [];
let examIndex = 0;
let examScore = 0;

function startIntro() {
  const imgEl = document.getElementById("introImage");
  const introScreen = document.getElementById("introScreen");
  if (!imgEl || !introScreen) return;
  // mostra a primeira imagem imediatamente
  imgEl.src = `assets/${introImages[0]}`;
  // clique para pular a introdução
  introScreen.onclick = () => endIntro();
  // ciclo automático de imagens
  introInterval = setInterval(() => {
    introIndex++;
    if (introIndex >= introImages.length) {
      endIntro();
    } else {
      imgEl.src = `assets/${introImages[introIndex]}`;
    }
  }, 3000);
}

function endIntro() {
  clearInterval(introInterval);
  // remove clique handler
  const introScreen = document.getElementById("introScreen");
  if (introScreen) introScreen.onclick = null;
  show("startScreen");
}

// inicia a introdução quando o DOM estiver pronto
if (typeof document !== 'undefined') {
  document.addEventListener("DOMContentLoaded", startIntro);
}

// ===========================
// UTILITÁRIOS DE TELAS
// ===========================

function show(screenId) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  const screen = document.getElementById(screenId);
  if (screen) screen.classList.add("active");
}

// ===========================
// TELA INICIAL -> AVATAR
// ===========================

function goToAvatar() {
  show("avatarScreen");
  renderAvatarList();
}

function renderAvatarList() {
  const container = document.getElementById("avatarList");
  container.innerHTML = "";

  for (let i = 1; i <= 10; i++) {
    const div = document.createElement("div");
    div.className = "avatar-option";

    const img = document.createElement("img");
    const fileName = `avatar_${String(i).padStart(2, "0")}.png`;
    img.src = `assets/${fileName}`;
    img.alt = `Avatar ${i}`;

    div.onclick = () => selectAvatar(div, fileName);

    div.appendChild(img);
    container.appendChild(div);
  }
}

function selectAvatar(element, fileName) {
  selectedAvatar = fileName;
  document.querySelectorAll(".avatar-option").forEach(a => a.classList.remove("selected"));
  element.classList.add("selected");
}

function confirmAvatar() {
  const nameInput = document.getElementById("playerName");
  playerName = (nameInput.value || "").trim();

  // Se nenhum avatar for selecionado (caso imagens não estejam disponíveis), utiliza um avatar padrão
  if (!selectedAvatar) {
    selectedAvatar = "avatar_01.png";
  }
  if (!playerName) {
    alert("Escolha um nome para continuar.");
    return;
  }

  startCaptainDialog();
}

// ===========================
// CAPITÃO – TEXTO MÁQUINA
// ===========================

function startCaptainDialog() {
  show("captainScreen");

  const text = `Valley City não é lugar para amadores. 
Temos poucos policiais, muitos crimes e quase nenhuma segunda chance. 
Você foi designado para esta unidade porque alguém acredita que você pode fazer a diferença. 
Faça seu trabalho, detetive.`;

  typeWriter("captainText", text, 30);
}

function typeWriter(elementId, text, speed) {
  const el = document.getElementById(elementId);
  if (!el) return;

  el.innerHTML = "";
  let i = 0;

  const interval = setInterval(() => {
    el.innerHTML += text.charAt(i);
    i++;
    if (i >= text.length) clearInterval(interval);
  }, speed);
}

// ===========================
// ESCRITÓRIO / HUD
// ===========================

function goToOffice() {
  show("officeScreen");

  const avatarImg = document.getElementById("officeAvatar");
  const nameEl = document.getElementById("officeName");

  if (avatarImg) avatarImg.src = `assets/${selectedAvatar}`;
  if (nameEl) nameEl.textContent = playerName.toUpperCase();

  updateHUD();
}

function updateHUD() {
  const prestigeBar = document.getElementById("prestBar");
  const moralBar = document.getElementById("moralBar");
  const repBar = document.getElementById("repBar");

  if (prestigeBar) prestigeBar.style.width = `${gameState.prestige}%`;
  if (moralBar) moralBar.style.width = `${gameState.moral}%`;
  if (repBar) repBar.style.width = `${gameState.reputation}%`;

  // Calcula ranking geral com base em estatísticas e casos resolvidos
  const baseRank = (gameState.prestige + gameState.moral + gameState.reputation) / 3;
  const bonus = gameState.solved * 2 - gameState.errors;
  gameState.rank = Math.max(0, Math.min(100, Math.round(baseRank + bonus)));
  // Score geral inclui ranking como base, podendo ser ajustado no futuro
  gameState.score = gameState.rank;
  // Atualiza cargo e ranking no HUD
  const agencyEl = document.getElementById("officeAgency");
  const rankEl = document.getElementById("officeRank");
  const scoreEl = document.getElementById("officeScore");
  if (agencyEl) {
    let cargo = "Polícia";
    if (gameState.agency === "FBI") cargo = "FBI";
    if (gameState.agency === "CIA") cargo = "CIA";
    agencyEl.textContent = `Cargo: ${cargo}`;
  }
  if (rankEl) {
    rankEl.textContent = `Ranking: ${gameState.rank}`;
  }
  if (scoreEl) {
    scoreEl.textContent = `Pontuação: ${gameState.score}`;
  }
}

// ===========================
// LISTAS DE TESTEMUNHAS, SUSPEITOS E PROVAS
// ===========================

/**
 * Abre a lista de testemunhas do caso atual.
 */
function openWitnessList() {
  if (!currentCase) {
    alert("Nenhum caso em investigação.");
    return;
  }
  renderList("witnessListContainer", currentCase.witnesses, false);
  show("witnessListScreen");
}

/**
 * Abre a lista de suspeitos do caso atual.
 */
function openSuspectList() {
  if (!currentCase) {
    alert("Nenhum caso em investigação.");
    return;
  }
  renderList("suspectListContainer", currentCase.suspects, true);
  show("suspectListScreen");
}

/**
 * Abre a lista de provas do caso atual.
 */
function openEvidenceList() {
  if (!currentCase) {
    alert("Nenhum caso em investigação.");
    return;
  }
  renderList("evidenceListContainer", currentCase.evidence, false);
  show("evidenceListScreen");
}

/**
 * Fecha qualquer lista de testemunhas/suspeitos/provas e retorna à tela de investigação.
 */
function closeList() {
  show("investigationScreen");
}

// ===========================
// SOLICITAÇÃO DE MANDADO
// ===========================

/**
 * Tela para selecionar a pessoa (suspeito ou testemunha) para solicitar mandado.
 */
function openWarrant() {
  if (!currentCase) {
    alert("Nenhum caso em investigação no momento.");
    return;
  }
  const container = document.getElementById("warrantOptions");
  if (!container) return;
  container.innerHTML = "";
  // Combina testemunhas e suspeitos em uma lista para seleção
  const options = [];
  if (currentCase.witnesses) options.push(...currentCase.witnesses);
  if (currentCase.suspects) options.push(...currentCase.suspects);
  if (!options.length) {
    container.innerHTML = "<p>Não há pessoas selecionáveis.</p>";
  } else {
    options.forEach(fileName => {
      const img = document.createElement("img");
      img.src = `assets/${fileName}`;
      img.alt = fileName;
      img.style.cursor = "pointer";
      img.style.width = "120px";
      img.style.height = "120px";
      img.style.borderRadius = "12px";
      img.style.objectFit = "cover";
      img.onclick = () => requestWarrantFor(fileName);
      container.appendChild(img);
    });
  }
  show("warrantScreen");
}

/**
 * Executa a lógica de pedido de mandado para a pessoa selecionada.
 * @param {string} target Nome do arquivo (suspeito ou testemunha)
 */
function requestWarrantFor(target) {
  // Simula a aprovação pelo juiz e os resultados do mandado
  const approved = Math.random() < 0.6;
  if (!approved) {
    alert("O juiz negou o pedido de mandado. Reúna mais provas.");
    gameState.reputation = Math.max(0, gameState.reputation - 3);
    updateHUD();
    closeWarrant();
    return;
  }
  const foundEvidence = Math.random() < 0.5;
  if (foundEvidence) {
    alert(`Busca realizada na residência de ${target}. Uma nova prova foi encontrada.`);
    gameState.prestige = Math.min(100, gameState.prestige + 5);
    gameState.reputation = Math.min(100, gameState.reputation + 4);
    // Nota: poderia adicionar nova prova ao caso
  } else {
    alert(`Busca realizada na residência de ${target}, mas nenhuma prova relevante foi encontrada.`);
    gameState.moral = Math.max(0, gameState.moral - 2);
  }
  updateHUD();
  closeWarrant();
  randomEvent();
}

function closeWarrant() {
  show("phoneScreen");
}

// ===========================
// DEMISSÃO E APOSENTADORIA
// ===========================

function openResign() {
  show("resignScreen");
}

function closeResign() {
  // Volta para a tela do chefe
  show("chiefScreen");
}

function confirmResign() {
  // Mostrar tela de aposentadoria e resumo de carreira
  openRetirement();
}

function openRetirement() {
  const retireAvatar = document.getElementById("retireAvatar");
  const retireSummary = document.getElementById("retireSummary");
  if (retireAvatar) retireAvatar.src = `assets/${selectedAvatar}`;
  // Calcula data de aposentadoria fictícia (hoje)
  const date = new Date();
  const formattedDate = date.toLocaleDateString("pt-BR");
  // Monta resumo de carreira
  const cargo = gameState.agency.toUpperCase();
  const summary = `Detective ${playerName},\nAgência: ${cargo}\nCasos resolvidos: ${gameState.solved}\nErros: ${gameState.errors}\nPrestígio: ${gameState.prestige}%\nMoral: ${gameState.moral}%\nReputação: ${gameState.reputation}%\nRanking final: ${gameState.rank}\nData da aposentadoria: ${formattedDate}`;
  if (retireSummary) retireSummary.textContent = summary;
  show("retirementScreen");
}

function exportRetirementPDF() {
  // Orienta o usuário a usar a impressão do navegador para salvar como PDF
  alert("Para salvar seu relatório de carreira em PDF, use a opção de impressão do seu navegador (Ctrl+P) e escolha 'Salvar como PDF'.");
}

function reloadGame() {
  // Recarrega a página para iniciar um novo jogo
  location.reload();
}

// ===========================
// PROMOÇÃO: RESULTADO PERSONALIZADO
// ===========================

// Sobrescreve endExam para exibir mensagem personalizada e redirecionar para tela de resultado.
function endExam() {
  const total = examQuestions.length;
  const percent = (examScore / total) * 100;
  const resultEl = document.getElementById("promotionResultMessage");
  if (percent >= 70) {
    // Aprovado
    gameState.agency = selectedAgency;
    if (resultEl) {
      resultEl.textContent = `Parabéns! Você passou no exame com ${percent.toFixed(0)}%.\nAgora você é ${selectedAgency.toUpperCase()}. Continue investigando casos mais complexos em sua nova função.`;
    }
  } else {
    if (resultEl) {
      resultEl.textContent = `Você obteve ${percent.toFixed(0)}% e não atingiu os 70% necessários. Tente novamente após resolver mais casos.`;
    }
  }
  // Resetar seleção
  selectedAgency = "";
  examQuestions = [];
  examIndex = 0;
  examScore = 0;
  // Mostrar tela de resultado
  show("promotionResultScreen");
}

// ===========================
// CARREGAMENTO DE CASOS (JSON)
// ===========================

async function ensureCasesLoaded() {
  if (casesLoaded) return;

  try {
    const response = await fetch("cases.json?nocache=" + Date.now(), { cache: "no-store" });
    const data = await response.json();
    casesData = data.cases || [];
    casesLoaded = true;
  } catch (err) {
    console.error("Erro ao carregar cases.json:", err);
    alert("Erro ao carregar os casos. Verifique o arquivo cases.json.");
  }
}

async function loadNextCase() {
  await ensureCasesLoaded();
  if (!casesData.length) {
    alert("Nenhum caso disponível.");
    return;
  }
  // Filtra os casos disponíveis de acordo com a agência do jogador. Casos sem nível são considerados básicos.
  const availableCases = casesData.filter(c => {
    const lvl = c.level || "police";
    if (gameState.agency === "police") {
      return lvl === "police";
    } else if (gameState.agency === "FBI") {
      return lvl === "police" || lvl === "FBI";
    }
    // CIA tem acesso a todos os níveis
    return true;
  });
  if (!availableCases.length) {
    alert("Nenhum caso disponível para sua função atual.");
    return;
  }
  if (currentCaseIndex >= availableCases.length) {
    alert("Você resolveu todos os casos disponíveis nesta versão.");
    return;
  }
  currentCase = availableCases[currentCaseIndex];
  const titleEl = document.getElementById("caseTitle");
  const imageEl = document.getElementById("caseImage");
  const summaryEl = document.getElementById("caseSummary");
  if (titleEl) titleEl.textContent = currentCase.title || "Novo Caso";
  if (imageEl) imageEl.src = `assets/${currentCase.scene}`;
  if (summaryEl) summaryEl.textContent = currentCase.summary || currentCase.description || "";
  show("caseScreen");
}

// ===========================
// INVESTIGAÇÃO
// ===========================

function openInvestigation() {
  if (!currentCase) {
    alert("Nenhum caso carregado.");
    return;
  }

  const titleEl = document.getElementById("caseTitle2");
  const descEl = document.getElementById("caseDescription");

  if (titleEl) titleEl.textContent = currentCase.title || "";
  if (descEl) descEl.textContent = currentCase.description || currentCase.summary || "";

  // A tela de investigação agora apresenta um menu. As listas de testemunhas, suspeitos e provas
  // são acessadas por botões separados. Portanto, não renderizamos nada aqui.
  show("investigationScreen");
}

function renderList(containerId, items, isSuspect) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "";
  if (!items || !items.length) {
    container.innerHTML = "<p>Sem itens disponíveis.</p>";
    return;
  }

    items.forEach(fileName => {
    const img = document.createElement("img");
    img.src = `assets/${fileName}`;
    img.alt = fileName;
    img.style.cursor = "pointer";

    if (isSuspect) {
      // abre interrogatório de suspeitos antes de acusar
      img.onclick = () => openSuspectDetail(fileName);
    } else {
      // se for um laudo/documento
      if (fileName.startsWith("evidence_doc")) {
        img.onclick = () => openForensic(fileName);
      } else if (fileName.startsWith("witness")) {
        // testemunhas levam à sala de interrogatório
        img.onclick = () => openWitnessDetail(fileName);
      } else {
        // demais evidências abrem modal genérico
        img.onclick = () => openDetail(fileName);
      }
    }

    container.appendChild(img);
  });
}

function chooseSuspect(fileName) {
  if (!currentCase) return;

  const correct = currentCase.real_culprit;

  if (fileName === correct) {
    alert("✔ Culpado correto! Bom trabalho, detetive.");
    gameState.solved++;
    gameState.prestige = Math.min(100, gameState.prestige + 10);
    gameState.moral = Math.min(100, gameState.moral + 5);
    gameState.reputation = Math.min(100, gameState.reputation + 7);

    currentCaseIndex++;
    currentCase = null;
    goToOffice();
    randomEvent();
  } else {
    alert("❌ Suspeito incorreto. Reveja as pistas.");
    gameState.errors++;
    gameState.moral = Math.max(0, gameState.moral - 5);
    gameState.reputation = Math.max(0, gameState.reputation - 5);
    updateHUD();
    randomEvent();
  }
}

function returnToCase() {
  show("caseScreen");
}

// ===========================
// TELEFONE – AÇÕES E EVENTOS
// ===========================

function callChief() {
  // Abre as opções de conversa com o chefe
  openChiefOptions();
}

function requestWarrant() {
  // Função desatualizada: redireciona para a seleção de mandado.
  openWarrant();
}

function callSuspect() {
  alert("Você tenta contato com um suspeito. Alguns atendem, outros não...");
  const success = Math.random() < 0.5;
  if (success) {
    alert("O suspeito atendeu, você obteve algumas informações valiosas.");
    gameState.moral = Math.min(100, gameState.moral + 2);
    gameState.reputation = Math.min(100, gameState.reputation + 1);
  } else {
    alert("O suspeito não atendeu ou recusou falar.");
    gameState.moral = Math.max(0, gameState.moral - 2);
  }
  updateHUD();
  randomEvent();
}

function randomEvent() {
  const events = [
    {
      msg: "Você recebe elogios públicos pelo seu trabalho.",
      effect: () => {
        gameState.prestige = Math.min(100, gameState.prestige + 3);
      }
    },
    {
      msg: "Um jornal critica a atuação da polícia, afetando sua reputação.",
      effect: () => {
        gameState.reputation = Math.max(0, gameState.reputation - 4);
      }
    },
    {
      msg: "Um colega traz café e motiva a equipe.",
      effect: () => {
        gameState.moral = Math.min(100, gameState.moral + 4);
      }
    },
    {
      msg: "Uma pista se perde no laboratório, atrasando a investigação.",
      effect: () => {
        gameState.prestige = Math.max(0, gameState.prestige - 3);
        gameState.moral = Math.max(0, gameState.moral - 3);
      }
    }
  ];
  const chosen = events[Math.floor(Math.random() * events.length)];
  alert("EVENTO: " + chosen.msg);
  chosen.effect();
  updateHUD();
}

// ===========================
// PROMOÇÃO E EXAMES
// ===========================

function chooseAgency(agency) {
  selectedAgency = agency;
  // Verifica se o jogador cumpre os requisitos para a agência escolhida.
  let eligible = false;
  if (gameState.agency === "police") {
    // Para qualquer agência (FBI ou CIA) partindo da polícia, requer 2 casos resolvidos,
    // prestígio >= 70 e pontuação >= 60.
    eligible = gameState.solved >= 2 && gameState.prestige >= 70 && gameState.score >= 60;
  } else if (gameState.agency === "FBI") {
    // Para transição de FBI para CIA, exige 4 casos resolvidos, prestígio >= 80 e pontuação >= 80.
    if (agency === "CIA") {
      eligible = gameState.solved >= 4 && gameState.prestige >= 80 && gameState.score >= 80;
    }
  }
  if (!eligible) {
    alert(
      `Você ainda não cumpre os requisitos para promoção para ${agency}. Resolva mais casos, aumente seu prestígio e pontuação geral.`
    );
    // Limpa a agência selecionada para evitar iniciar o exame de forma acidental.
    selectedAgency = "";
    return;
  }
  startExam();
}

function startExam() {
  // Define questões de acordo com a agência escolhida
  examIndex = 0;
  examScore = 0;
  if (selectedAgency === "FBI") {
    examQuestions = [
      { q: "Qual é a sigla oficial do Federal Bureau of Investigation?", options: ["FBI", "CIA", "NSA"], correct: 0 },
      { q: "Qual a principal função da FBI?", options: ["Espionagem internacional", "Investigar crimes federais", "Segurança nacional"], correct: 1 },
      { q: "Em qual país foi criado o FBI?", options: ["Brasil", "Estados Unidos", "Reino Unido"], correct: 1 },
      { q: "Qual desses não é uma prioridade do FBI?", options: ["Terrorismo", "Crimes de colarinho branco", "Trânsito"], correct: 2 },
      { q: "O FBI responde diretamente a qual departamento?", options: ["Departamento de Estado", "Departamento de Justiça", "Departamento de Defesa"], correct: 1 }
    ];
  } else if (selectedAgency === "CIA") {
    examQuestions = [
      { q: "Qual é a sigla oficial da Central Intelligence Agency?", options: ["FBI", "CIA", "NSA"], correct: 1 },
      { q: "Qual é o foco principal da CIA?", options: ["Investigação de crimes internos", "Operações de inteligência internacional", "Cuidados médicos"], correct: 1 },
      { q: "A CIA foi fundada em que ano?", options: ["1947", "1953", "1960"], correct: 0 },
      { q: "Quem é o diretor da CIA nomeado pelo presidente?", options: ["Secretário de Estado", "Procurador-Geral", "Diretor de Inteligência Central"], correct: 2 },
      { q: "Qual das opções a seguir não é uma responsabilidade da CIA?", options: ["Espionagem", "Contrainteligência", "Repressão a crimes locais"], correct: 2 }
    ];
  } else {
    examQuestions = [];
  }
  renderExamQuestion();
  show("examScreen");
}

function renderExamQuestion() {
  const qEl = document.getElementById("examQuestion");
  const optionsEl = document.getElementById("examOptions");
  const nextBtn = document.getElementById("nextExamBtn");
  const finishBtn = document.getElementById("finishExamBtn");
  if (!qEl || !optionsEl || !nextBtn || !finishBtn) return;
  // Limpar
  optionsEl.innerHTML = "";
  if (examIndex < examQuestions.length) {
    const item = examQuestions[examIndex];
    qEl.textContent = item.q;
    item.options.forEach((opt, idx) => {
      const btn = document.createElement("button");
      btn.textContent = opt;
      btn.onclick = () => {
        if (idx === item.correct) examScore++;
        nextExamQuestion();
      };
      optionsEl.appendChild(btn);
    });
    // Mostrar ou esconder botões
    nextBtn.style.display = "none";
    finishBtn.style.display = "none";
  } else {
    // fim
    endExam();
  }
}

function nextExamQuestion() {
  examIndex++;
  if (examIndex < examQuestions.length) {
    renderExamQuestion();
  } else {
    endExam();
  }
}

// A lógica do final do exame está implementada na função endExam mais abaixo

// ===========================
// CHEFE E AJUDA
// ===========================

function openChiefOptions() {
  show("chiefScreen");
}

function praiseTeam() {
  alert("Você elogia sua equipe pelo ótimo trabalho. Moral e prestígio aumentam.");
  gameState.moral = Math.min(100, gameState.moral + 5);
  gameState.prestige = Math.min(100, gameState.prestige + 4);
  updateHUD();
  closeChief();
}

function askHelp() {
  // Abre tela de ajuda
  show("helpScreen");
}

function closeChief() {
  show("phoneScreen");
}

function closeHelp() {
  show("phoneScreen");
}

// ===========================
// MODAL DE DETALHES
// ===========================

function openDetail(fileName) {
  const modal = document.getElementById("detailModal");
  const detailImg = document.getElementById("detailImage");
  const detailTitle = document.getElementById("detailTitle");
  const detailDesc = document.getElementById("detailDescription");
  if (!modal || !detailImg || !detailTitle || !detailDesc) return;
  detailImg.src = `assets/${fileName}`;
  let title = "";
  let desc = "";
  if (fileName.startsWith("witness")) {
    title = "Testemunha";
    desc = "Esta é uma testemunha do caso. Colete informações conversando.";
  } else if (fileName.startsWith("evidence")) {
    title = "Prova";
    desc = "Esta é uma prova coletada na cena. Analise-a com cuidado.";
  } else if (fileName.startsWith("suspect")) {
    title = "Suspeito";
    desc = "Esta pessoa é um suspeito. Escolha com cuidado.";
  } else {
    title = "Detalhe";
    desc = "Informações adicionais indisponíveis.";
  }
  detailTitle.textContent = title;
  detailDesc.textContent = desc;
  modal.classList.add("active");
}

function closeDetail() {
  const modal = document.getElementById("detailModal");
  if (modal) modal.classList.remove("active");
}

// ===========================
// VISUALIZAÇÃO DE LAUDOS/FORENSE
// ===========================

function openForensic(fileName) {
  const imgEl = document.getElementById("forensicImage");
  if (imgEl) {
    imgEl.src = `assets/${fileName}`;
    show("forensicScreen");
  }
}

function closeForensic() {
  // Volta para a tela de investigação para continuar analisando
  show("investigationScreen");
}

// ===========================
// SALA DE INTERROGATÓRIO / TESTEMUNHAS
// ===========================

/**
 * Exibe a sala de interrogatório com a imagem e uma descrição de testemunha.
 * @param {string} fileName Nome do arquivo da testemunha a ser exibido.
 */
function openWitnessDetail(fileName) {
  currentWitness = fileName;
  witnessMood = 100;
  const titleEl = document.getElementById("interrogationTitle");
  const imgEl = document.getElementById("interrogationImage");
  const descEl = document.getElementById("interrogationDescription");
  const questionContainer = document.getElementById("interrogationQuestions");
  // Backwards compatibility: if container doesn't exist, create one in place of descEl
  if (titleEl) titleEl.textContent = "Testemunha";
  if (imgEl) imgEl.src = `assets/${fileName}`;
  if (descEl) {
    descEl.textContent = "Escolha uma pergunta para interrogar a testemunha.";
  }
  // Inicializa barra e texto de humor
  const moodText = document.getElementById("witnessMoodText");
  const moodBar = document.getElementById("witnessMoodBar");
  if (moodText) moodText.textContent = `Humor: ${witnessMood}%`;
  if (moodBar) moodBar.style.width = `${witnessMood}%`;
  // Criar perguntas
  let questions = witnessQuestions[fileName] || witnessQuestions.default;
  // Remove perguntas antigas
  const list = document.getElementById("witnessQuestionsList");
  if (list) list.innerHTML = "";
  // Garante um contêiner
  if (questions && list) {
    questions.forEach((obj, idx) => {
      const btn = document.createElement("button");
      btn.textContent = obj.q;
      btn.onclick = () => askWitnessQuestion(idx);
      list.appendChild(btn);
    });
  }
  show("interrogationScreen");
}

function askWitnessQuestion(idx) {
  const questions = witnessQuestions[currentWitness] || witnessQuestions.default;
  const q = questions[idx];
  if (!q) return;
  // Mostrar resposta na descrição com efeito máquina
  const descEl = document.getElementById("interrogationDescription");
  if (descEl) {
    typeWriter("interrogationDescription", q.a, 30);
  } else {
    alert(q.a);
  }
  // Ajustar humor aleatoriamente
  witnessMood = Math.max(0, witnessMood - Math.floor(Math.random() * 10 + 5));
  // Atualiza texto e barra de humor
  const moodText = document.getElementById("witnessMoodText");
  const moodBar = document.getElementById("witnessMoodBar");
  if (moodText) {
    if (witnessMood > 0) {
      moodText.textContent = `Humor: ${witnessMood}%`;
    } else {
      moodText.textContent = "Humor: 0% (Testemunha não coopera)";
    }
  }
  if (moodBar) {
    moodBar.style.width = `${witnessMood}%`;
  }
  // Se humor zerou, desabilitar perguntas
  const list = document.getElementById("witnessQuestionsList");
  if (witnessMood <= 0 && list) {
    list.querySelectorAll("button").forEach(btn => btn.disabled = true);
  }
}

// Fechar interrogatório de suspeito
function closeSuspect() {
  show("investigationScreen");
}

// Abrir interrogatório de suspeito
function openSuspectDetail(fileName) {
  currentSuspect = fileName;
  suspectMood = 100;
  const titleEl = document.getElementById("suspectTitle");
  const imgEl = document.getElementById("suspectImage");
  const moodEl = document.getElementById("suspectMood");
  const qContainer = document.getElementById("suspectQuestions");
  const accuseBtn = document.getElementById("accuseBtn");
  if (titleEl) titleEl.textContent = "Suspeito";
  if (imgEl) imgEl.src = `assets/${fileName}`;
  if (moodEl) moodEl.textContent = suspectMood;
  // Inicializa barra de humor do suspeito
  const moodBar = document.getElementById("suspectMoodBar");
  if (moodBar) moodBar.style.width = `${suspectMood}%`;
  if (qContainer) qContainer.innerHTML = "";
  const questions = suspectQuestions[fileName] || suspectQuestions.default;
  questions.forEach((obj, idx) => {
    const btn = document.createElement("button");
    btn.textContent = obj.q;
    btn.onclick = () => askSuspectQuestion(idx);
    qContainer.appendChild(btn);
  });
  if (accuseBtn) {
    accuseBtn.onclick = () => chooseSuspect(fileName);
  }
  // Resetar campo de resposta
  const respEl = document.getElementById("suspectResponse");
  if (respEl) {
    respEl.textContent = "Escolha uma pergunta para interrogar o suspeito.";
  }
  show("suspectScreen");
}

function askSuspectQuestion(idx) {
  const questions = suspectQuestions[currentSuspect] || suspectQuestions.default;
  const q = questions[idx];
  if (!q) return;
  // Determine se a resposta é mentira ou verdade
  const truth = Math.random() < 0.6; // 60% de chance de verdade
  let response = q.a;
  response += truth ? "\n[Detector: Verdade]" : "\n[Detector: Mentira]";
  // Mostrar resposta com efeito máquina no campo apropriado
  const respEl = document.getElementById("suspectResponse");
  if (respEl) {
    typeWriter("suspectResponse", response, 30);
  } else {
    alert(response);
  }
  // Ajustar humor
  suspectMood = Math.max(0, suspectMood - Math.floor(Math.random() * 10 + 5));
  const moodEl = document.getElementById("suspectMood");
  if (moodEl) moodEl.textContent = suspectMood;
  // Atualiza barra de humor do suspeito
  const moodBar = document.getElementById("suspectMoodBar");
  if (moodBar) {
    moodBar.style.width = `${suspectMood}%`;
  }
  if (suspectMood <= 0) {
    const qContainer = document.getElementById("suspectQuestions");
    if (qContainer) qContainer.querySelectorAll("button").forEach(btn => btn.disabled = true);
  }
}

/**
 * Fecha a sala de interrogatório e retorna à tela de investigação.
 */
function closeInterrogation() {
  show("investigationScreen");
}

// ===========================
// ESTATÍSTICAS / TELEFONE / PROMOÇÃO (SIMPLES)
// ===========================

function openStats() {
  // Atualiza a tela de estatísticas e a exibe
  const solvedEl = document.getElementById("statSolved");
  const errorsEl = document.getElementById("statErrors");
  const agencyEl = document.getElementById("statAgency");
  const nextEl = document.getElementById("statNextPromotion");
  const prestigeBar = document.getElementById("statPrestBar");
  const moralBar = document.getElementById("statMoralBar");
  const repBar = document.getElementById("statRepBar");
  const prestigePercentEl = document.getElementById("statPrestPercent");
  const moralPercentEl = document.getElementById("statMoralPercent");
  const repPercentEl = document.getElementById("statRepPercent");
  if (solvedEl) solvedEl.textContent = gameState.solved;
  if (errorsEl) errorsEl.textContent = gameState.errors;
  // Atualiza barras e porcentagens
  const p = gameState.prestige;
  const m = gameState.moral;
  const r = gameState.reputation;
  if (prestigeBar) prestigeBar.style.width = `${p}%`;
  if (moralBar) moralBar.style.width = `${m}%`;
  if (repBar) repBar.style.width = `${r}%`;
  if (prestigePercentEl) prestigePercentEl.textContent = `${p}%`;
  if (moralPercentEl) moralPercentEl.textContent = `${m}%`;
  if (repPercentEl) repPercentEl.textContent = `${r}%`;
  // Avatar e agência
  const statAvatar = document.getElementById("statAvatar");
  if (statAvatar) statAvatar.src = `assets/${selectedAvatar}`;
  if (agencyEl) agencyEl.textContent = gameState.agency.toUpperCase();
  // Próxima promoção: calcula requisitos restantes
  if (nextEl) {
    if (gameState.agency === "police") {
      const casesNeed = Math.max(0, 2 - gameState.solved);
      const prestigeNeed = Math.max(0, 70 - gameState.prestige);
      const scoreNeed = Math.max(0, 60 - gameState.score);
      if (casesNeed === 0 && prestigeNeed === 0 && scoreNeed === 0) {
        nextEl.textContent = "Você já pode solicitar promoção para FBI/CIA.";
      } else {
        nextEl.textContent = `Falta(m) ${casesNeed} caso(s) resolvido(s), ${prestigeNeed}% de prestígio e ${scoreNeed} pontos para a próxima promoção.`;
      }
    } else if (gameState.agency === "FBI") {
      const casesNeed = Math.max(0, 4 - gameState.solved);
      const prestigeNeed = Math.max(0, 80 - gameState.prestige);
      const scoreNeed = Math.max(0, 80 - gameState.score);
      if (casesNeed === 0 && prestigeNeed === 0 && scoreNeed === 0) {
        nextEl.textContent = "Você já pode solicitar promoção para CIA.";
      } else {
        nextEl.textContent = `Falta(m) ${casesNeed} caso(s) resolvido(s), ${prestigeNeed}% de prestígio e ${scoreNeed} pontos para a próxima promoção.`;
      }
    } else {
      nextEl.textContent = "Você alcançou o nível máximo de agência.";
    }
  }
  // Exibe pontuação geral
  const statRankEl = document.getElementById("statRankText");
  if (statRankEl) {
    statRankEl.textContent = `Pontuação geral: ${gameState.score}`;
  }
  show("statsScreen");
}

function openPhone() {
  // Esta versão anterior do telefone foi substituída pela interface visual.
  // Chama a nova tela de telefone definida mais abaixo.
  show("phoneScreen");
}

function openPromotion() {
  // Mostra a tela de promoção sempre com as opções de agência visíveis.
  const msgEl = document.getElementById("promotionMessage");
  const optionsEl = document.getElementById("agencyOptions");
  if (!msgEl || !optionsEl) {
    alert("Erro ao abrir a tela de promoção.");
    return;
  }
  // Se já é CIA, não há promoções posteriores.
  if (gameState.agency === "CIA") {
    msgEl.textContent = "Você já alcançou o nível mais alto (CIA).";
    optionsEl.style.display = "none";
  } else {
    // Explica ao usuário que deve escolher a agência e que os requisitos serão verificados ao clicar.
    msgEl.textContent = "Selecione a agência desejada. Os requisitos serão verificados após sua escolha.";
    optionsEl.style.display = "flex";
  }
  show("promotionScreen");
}

// ===========================
// SOBRESCRITAS DE FUNÇÕES PADRÃO
// ===========================
// Substitui a implementação original de openPhone por uma que exibe a nova tela de telefone.
function openPhone() {
  show("phoneScreen");
}
