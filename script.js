// Game variables
let deck = [];
const piles = [];
const numPiles = 10;
const completedSequences = [];

const allSuits = ["♠", "♥", "♦", "♣"];
const ranks = [
  "A",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
];
let suits = [...allSuits]; // Default to all suits (hard difficulty)

// Initialize deck based on selected difficulty
function initializeDeck() {
  deck = [];
  const deckCount = Math.ceil(
    (numPiles * 5 + 4 + numPiles * 5) / (suits.length * ranks.length)
  );
  for (let i = 0; i < deckCount; i++) {
    for (let suit of suits) {
      for (let rank of ranks) {
        deck.push({ rank, suit, visible: false });
      }
    }
  }
  shuffle(deck);
}

// Shuffle deck
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// Initialize piles
function initializePiles() {
  for (let i = 0; i < numPiles; i++) {
    piles[i] = [];
  }
}

// Deal cards to piles
function deal() {
  if (deck.length < numPiles * 5 + 4) {
    console.error("Not enough cards in the deck to deal.");
    return;
  }

  const container = document.getElementById("deck");
  container.innerHTML = "";

  for (let i = 0; i < numPiles; i++) {
    const pileDiv = document.createElement("div");
    pileDiv.classList.add("pile");
    pileDiv.dataset.pileIndex = i;

    const cardsInPile = i < 4 ? 6 : 5;

    for (let j = 0; j < cardsInPile; j++) {
      const card = deck.pop();
      card.visible = j === cardsInPile - 1;
      piles[i].push(card);

      const cardDiv = document.createElement("div");
      cardDiv.classList.add("card");
      cardDiv.dataset.pileIndex = i;
      cardDiv.dataset.cardIndex = piles[i].length - 1;
      cardDiv.style.setProperty("--card-index", j);

      if (card.visible) {
        cardDiv.dataset.rank = card.rank;
        cardDiv.dataset.suit = card.suit;
      } else {
        cardDiv.classList.add("hidden");
      }

      pileDiv.appendChild(cardDiv);
    }

    container.appendChild(pileDiv);
  }

  updateTopDeck();
  addDragAndDropListeners();
}

// Add cards from top deck to piles
function dealToPiles() {
  if (deck.length < numPiles) {
    console.error("No more cards left in the deck.");
    alert("No more cards left to deal.");
    return;
  }

  for (let i = 0; i < numPiles; i++) {
    const card = deck.pop();
    card.visible = true;
    piles[i].push(card);
  }

  updatePiles();
  updateTopDeck();
}

// Update the top deck display
function updateTopDeck() {
  const topDeck = document.getElementById("top-deck");
  topDeck.innerHTML = "";

  if (deck.length > 0) {
    const topCard = deck[deck.length - 1];
    const cardDiv = document.createElement("div");
    cardDiv.classList.add("card");
    cardDiv.dataset.rank = topCard.rank;
    cardDiv.dataset.suit = topCard.suit;
    topDeck.appendChild(cardDiv);
  }
}

// Add event listener to top deck
function addTopDeckListener() {
  document.getElementById("top-deck").addEventListener("click", dealToPiles);
}

// Add event listeners for drag-and-drop functionality
function addDragAndDropListeners() {
  const cards = document.querySelectorAll(".card");

  cards.forEach((card) => {
    card.draggable = true;

    card.addEventListener("dragstart", (event) => {
      const pileIndex = event.target.dataset.pileIndex;
      const cardIndex = event.target.dataset.cardIndex;

      if (!isSingleSuitSequence(pileIndex, cardIndex)) {
        console.error("Cannot drag a sequence with mixed suits.");
        event.preventDefault();
      } else {
        event.dataTransfer.setData(
          "text/plain",
          JSON.stringify({ pileIndex, cardIndex })
        );
      }
    });
  });

  const pileElements = document.querySelectorAll(".pile");

  pileElements.forEach((pileElement) => {
    pileElement.addEventListener("dragover", (event) => {
      event.preventDefault();
    });

    pileElement.addEventListener("drop", (event) => {
      event.preventDefault();

      const data = JSON.parse(event.dataTransfer.getData("text/plain"));
      const sourcePileIndex = parseInt(data.pileIndex, 10);
      const cardIndex = parseInt(data.cardIndex, 10);

      const targetPileIndex = parseInt(
        event.currentTarget.dataset.pileIndex,
        10
      );

      if (sourcePileIndex === targetPileIndex) {
        return;
      }

      const movingCards = piles[sourcePileIndex].slice(cardIndex);

      if (!isValidMove(movingCards, piles[targetPileIndex])) {
        console.error("Invalid move: Cards must be in descending order.");
        return;
      }

      piles[sourcePileIndex] = piles[sourcePileIndex].slice(0, cardIndex);

      if (piles[sourcePileIndex].length > 0) {
        piles[sourcePileIndex][
          piles[sourcePileIndex].length - 1
        ].visible = true;
      }

      piles[targetPileIndex] = piles[targetPileIndex].concat(movingCards);
      updatePiles();

      checkForCompleteSequence(targetPileIndex);
    });
  });
}

// Check if a move is valid
function isValidMove(movingCards, targetPile) {
  if (targetPile.length === 0) return true;

  const visibleTargetPile = targetPile.filter((card) => card.visible);
  if (visibleTargetPile.length === 0) return true;

  const topCard = visibleTargetPile[visibleTargetPile.length - 1];
  const firstMovingCard = movingCards[0];

  const topRankIndex = ranks.indexOf(topCard.rank);
  const movingRankIndex = ranks.indexOf(firstMovingCard.rank);

  return topRankIndex === movingRankIndex + 1;
}

// Check for single-suit sequence
function isSingleSuitSequence(pileIndex, cardIndex) {
  const sequence = piles[pileIndex].slice(cardIndex);
  const suit = sequence[0].suit;

  return sequence.every((card) => card.suit === suit);
}

// Check for a complete sequence
function checkForCompleteSequence(pileIndex) {
  const pile = piles[pileIndex];

  // Filter only visible cards for sequence validation
  const visiblePile = pile.filter((card) => card.visible);

  if (visiblePile.length < 13) return;

  const last13Cards = visiblePile.slice(-13);

  for (let i = 0; i < 12; i++) {
    const currentCard = last13Cards[i];
    const nextCard = last13Cards[i + 1];

    if (
      ranks.indexOf(currentCard.rank) !== ranks.indexOf(nextCard.rank) + 1 ||
      currentCard.suit !== nextCard.suit
    ) {
      return;
    }
  }

  // Move complete sequence to completed sequences
  completedSequences.push(pile.splice(pile.length - 13, 13));
  updateCompletedSequences();

  if (pile.length > 0) {
    pile[pile.length - 1].visible = true;
  }

  updatePiles();
  console.log("Complete sequence removed!");
}

// Update completed sequences display
function updateCompletedSequences() {
  const container = document.getElementById("completed-sequences");
  container.innerHTML = "";

  completedSequences.forEach((sequence) => {
    const sequenceDiv = document.createElement("div");
    sequenceDiv.classList.add("completed-sequence");
    const aceCard = sequence.find((card) => card.rank === "A");
    sequenceDiv.dataset.suit = aceCard.suit;
    sequenceDiv.dataset.rank = aceCard.rank;
    sequenceDiv.textContent = `${aceCard.rank} ${aceCard.suit}`;
    container.appendChild(sequenceDiv);
  });
}

// Update piles after moving cards
function updatePiles() {
  const container = document.getElementById("deck");
  container.innerHTML = "";

  piles.forEach((pile, pileIndex) => {
    const pileDiv = document.createElement("div");
    pileDiv.classList.add("pile");
    pileDiv.dataset.pileIndex = pileIndex;

    pile.forEach((card, cardIndex) => {
      const cardDiv = document.createElement("div");
      cardDiv.classList.add("card");
      cardDiv.dataset.pileIndex = pileIndex;
      cardDiv.dataset.cardIndex = cardIndex;
      cardDiv.style.setProperty("--card-index", cardIndex);

      if (card.visible) {
        cardDiv.dataset.rank = card.rank;
        cardDiv.dataset.suit = card.suit;
      } else {
        cardDiv.classList.add("hidden");
      }

      pileDiv.appendChild(cardDiv);
    });

    container.appendChild(pileDiv);
  });

  addDragAndDropListeners();
}

// Add event listener to New Game button
document.getElementById("deal").addEventListener("click", () => {
  startNewGame();
});

document.getElementById("difficulty").addEventListener("change", () => {
  startNewGame();
});

function startNewGame() {
  const difficulty = document.getElementById("difficulty").value;

  switch (difficulty) {
    case "easy":
      suits = ["♣"];
      break;
    case "medium":
      suits = ["♣", "♦"];
      break;
    case "hard":
    default:
      suits = [...allSuits];
      break;
  }

  initializeDeck();
  initializePiles();
  deal();
}

// Initialize and deal on first load
initializeDeck();
initializePiles();
deal();
addTopDeckListener();
