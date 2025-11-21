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
  errors: 0
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

  if (currentCaseIndex >= casesData.length) {
    alert("Você resolveu todos os casos disponíveis nesta versão.");
    return;
  }

  currentCase = casesData[currentCaseIndex];

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

  renderList("witnesses", currentCase.witnesses, false);
  renderList("evidence", currentCase.evidence, false);
  renderList("suspects", currentCase.suspects, true);

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
      // seleção de suspeitos
      img.onclick = () => chooseSuspect(fileName);
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
  alert("Chefe: 'Faça seu trabalho direito e mantenha o distrito sob controle.'");
  gameState.moral = Math.min(100, gameState.moral + 3);
  gameState.prestige = Math.min(100, gameState.prestige + 2);
  updateHUD();
  randomEvent();
}

function requestWarrant() {
  alert("Você solicita um mandado de busca. Isso pode destravar novas pistas.");
  gameState.reputation = Math.min(100, gameState.reputation + 3);
  updateHUD();
  randomEvent();
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
  const titleEl = document.getElementById("interrogationTitle");
  const imgEl = document.getElementById("interrogationImage");
  const descEl = document.getElementById("interrogationDescription");
  if (!titleEl || !imgEl || !descEl) return;
  imgEl.src = `assets/${fileName}`;
  titleEl.textContent = "Testemunha";
  descEl.textContent =
    "A testemunha está nervosa. Converse para coletar informações e anote detalhes importantes.";
  show("interrogationScreen");
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
  document.getElementById("statSolved").textContent = gameState.solved;
  document.getElementById("statErrors").textContent = gameState.errors;
  document.getElementById("statPrestige").textContent = gameState.prestige;
  document.getElementById("statMoral").textContent = gameState.moral;
  document.getElementById("statReputation").textContent = gameState.reputation;
  show("statsScreen");
}

function openPhone() {
  const opcao = prompt(
    "Telefone:\n" +
    "1 - Ligar para o chefe\n" +
    "2 - Solicitar mandado de busca\n" +
    "3 - Ligar para um suspeito"
  );

  switch (opcao) {
    case "1":
      alert("Chefe: 'Faça seu trabalho direito e mantenha o distrito sob controle.'");
      gameState.moral = Math.min(100, gameState.moral + 3);
      updateHUD();
      break;
    case "2":
      alert("Você solicita um mandado de busca. (Em uma versão futura, isso abrirá novas pistas no caso).");
      break;
    case "3":
      alert("Você tenta contato com um suspeito. Alguns atendem, outros não... (Sistema detalhado em futura versão).");
      break;
    default:
      alert("Nenhuma ligação realizada.");
  }
}

function openPromotion() {
  if (gameState.solved >= 2 && gameState.prestige >= 70) {
    alert("Parabéns! Você já teria perfil para promoção.\n(Sistema de cargos FBI/CIA entrará em uma próxima versão).");
  } else {
    alert(
      "Ainda não é o momento para promoção.\n" +
      "Precisa de mais casos resolvidos e mais prestígio."
    );
  }
}

// ===========================
// SOBRESCRITAS DE FUNÇÕES PADRÃO
// ===========================
// Substitui a implementação original de openPhone por uma que exibe a nova tela de telefone.
function openPhone() {
  show("phoneScreen");
}
