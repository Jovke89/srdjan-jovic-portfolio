/* Blackjack game START */
/* Blackjack for /game-room/blackjack/. Cards and chips are real buttons (HTML,
   not canvas), so everything works with mouse, keyboard and focus. Start with
   1000 credits, stack a bet from 50 / 100 / 500 / 1000 chips, then hit, stand
   or double. Dealer draws to 17, blackjack pays 3:2, a push returns the bet.
   Four decks are shuffled together and reshuffled when a quarter is left. The
   best (highest) credit total is kept per browser in localStorage. */
const START_CREDITS = 1000;
const DECKS = 4;
const BEST_KEY = 'game-room-blackjack-best';
const DEAL_GAP_MS = 380;
const SUITS = ['♠', '♥', '♦', '♣'] as const;
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'] as const;

interface Card { rank: number; suit: number }
type Phase = 'ready' | 'bet' | 'dealing' | 'player' | 'dealer' | 'over';

function readBest(): number {
  try {
    return Number(localStorage.getItem(BEST_KEY)) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value: number) {
  try {
    localStorage.setItem(BEST_KEY, String(value));
  } catch {
    /* Storage blocked: the best total just isn't remembered. */
  }
}

/* Aces count 11 until that would bust, then 1. */
function total(hand: Card[]) {
  let sum = 0;
  let aces = 0;
  hand.forEach((c) => {
    if (c.rank === 12) {
      aces += 1;
      sum += 11;
    } else sum += Math.min(10, c.rank + 2);
  });
  while (sum > 21 && aces) {
    sum -= 10;
    aces -= 1;
  }
  return sum;
}

const isBlackjack = (hand: Card[]) => hand.length === 2 && total(hand) === 21;
const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

function initBlackjack() {
  const root = document.querySelector<HTMLElement>('[data-blackjack]');
  if (!root) return;
  const overlay = root.querySelector<HTMLElement>('[data-game-overlay]')!;
  const titleEl = root.querySelector<HTMLElement>('[data-game-title]')!;
  const textEl = root.querySelector<HTMLElement>('[data-game-text]')!;
  const startBtn = root.querySelector<HTMLButtonElement>('[data-game-start]')!;
  const creditsEl = root.querySelector<HTMLElement>('[data-bj-credits]')!;
  const betEl = root.querySelector<HTMLElement>('[data-bj-bet]')!;
  const winEl = root.querySelector<HTMLElement>('[data-bj-win]')!;
  const bestEl = root.querySelector<HTMLElement>('[data-game-best]')!;
  const messageEl = root.querySelector<HTMLElement>('[data-bj-message]')!;
  const dealerEl = root.querySelector<HTMLElement>('[data-bj-dealer]')!;
  const playerEl = root.querySelector<HTMLElement>('[data-bj-player]')!;
  const dealerTotalEl = root.querySelector<HTMLElement>('[data-bj-dealer-total]')!;
  const playerTotalEl = root.querySelector<HTMLElement>('[data-bj-player-total]')!;
  const chipBtns = [...root.querySelectorAll<HTMLButtonElement>('[data-chip]')];
  const clearBtn = root.querySelector<HTMLButtonElement>('[data-bj-clear]')!;
  const dealBtn = root.querySelector<HTMLButtonElement>('[data-bj-deal]')!;
  const hitBtn = root.querySelector<HTMLButtonElement>('[data-bj-hit]')!;
  const standBtn = root.querySelector<HTMLButtonElement>('[data-bj-stand]')!;
  const doubleBtn = root.querySelector<HTMLButtonElement>('[data-bj-double]')!;
  const cardTemplate = root.querySelector<HTMLTemplateElement>('[data-card-template]')!;

  let phase: Phase = 'ready';
  let credits = START_CREDITS;
  let bet = 0;
  let lastBet = 0;
  let best = readBest();
  let shoe: Card[] = [];
  let dealer: Card[] = [];
  let player: Card[] = [];
  let holeHidden = true;

  bestEl.textContent = String(best);

  const shuffle = () => {
    shoe = [];
    for (let d = 0; d < DECKS; d++) for (let s = 0; s < 4; s++) for (let r = 0; r < 13; r++) shoe.push({ rank: r, suit: s });
    for (let i = shoe.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shoe[i], shoe[j]] = [shoe[j], shoe[i]];
    }
  };

  const draw = () => {
    if (shoe.length < (DECKS * 52) / 4) shuffle();
    return shoe.pop()!;
  };

  const renderHud = () => {
    creditsEl.textContent = String(credits);
    betEl.textContent = String(bet);
    if (credits > best) {
      best = credits;
      bestEl.textContent = String(best);
      saveBest(best);
    }
  };

  const fillCard = (el: HTMLElement, card: Card, faceDown: boolean) => {
    const face = el.querySelector<HTMLElement>('[data-card-face]')!;
    face.classList.toggle('is-red', card.suit === 1 || card.suit === 2);
    face.querySelectorAll<HTMLElement>('[data-rank]').forEach((r) => (r.textContent = RANKS[card.rank]));
    face.querySelectorAll<HTMLElement>('[data-suit]').forEach((s) => (s.textContent = SUITS[card.suit]));
    el.classList.toggle('is-down', faceDown);
    el.setAttribute('aria-label', faceDown ? 'Card face down' : `${RANKS[card.rank]} ${SUITS[card.suit]}`);
  };

  /* Adds one card element and flips it face up (unless it is the hole card). */
  const addCard = (row: HTMLElement, card: Card, faceDown = false) => {
    const el = cardTemplate.content.firstElementChild!.cloneNode(true) as HTMLElement;
    fillCard(el, card, true);
    row.appendChild(el);
    if (!faceDown) {
      requestAnimationFrame(() => requestAnimationFrame(() => fillCard(el, card, false)));
    }
  };

  const renderTotals = () => {
    playerTotalEl.textContent = String(player.length ? total(player) : 0);
    dealerTotalEl.textContent = String(!dealer.length ? 0 : holeHidden ? total([dealer[0]]) : total(dealer));
  };

  const renderControls = () => {
    const betting = phase === 'bet';
    chipBtns.forEach((b) => (b.disabled = !betting || bet + Number(b.dataset.chip) > credits));
    clearBtn.disabled = !betting || bet === 0;
    dealBtn.disabled = !betting || bet === 0;
    hitBtn.disabled = phase !== 'player';
    standBtn.disabled = phase !== 'player';
    doubleBtn.disabled = phase !== 'player' || player.length !== 2 || credits < bet;
  };

  const settle = async () => {
    phase = 'dealer';
    renderControls();
    // Reveal the hole card, then the dealer draws to 17.
    holeHidden = false;
    const hole = dealerEl.children[1] as HTMLElement | undefined;
    if (hole) fillCard(hole, dealer[1], false);
    renderTotals();
    const playerTotal = total(player);
    if (playerTotal <= 21 && !isBlackjack(player)) {
      while (total(dealer) < 17) {
        await wait(DEAL_GAP_MS + 120);
        const card = draw();
        dealer.push(card);
        addCard(dealerEl, card);
        renderTotals();
      }
    }
    await wait(350);
    const dealerTotal = total(dealer);
    let payout = 0;
    let message: string;
    if (playerTotal > 21) message = `Bust with ${playerTotal}. You lose ${bet}.`;
    else if (isBlackjack(player) && !isBlackjack(dealer)) {
      payout = Math.floor(bet * 2.5);
      message = `Blackjack! You win ${payout - bet}.`;
    } else if (isBlackjack(dealer) && !isBlackjack(player)) message = `Dealer has blackjack. You lose ${bet}.`;
    else if (dealerTotal > 21) {
      payout = bet * 2;
      message = `Dealer busts with ${dealerTotal}. You win ${bet}.`;
    } else if (playerTotal > dealerTotal) {
      payout = bet * 2;
      message = `${playerTotal} beats ${dealerTotal}. You win ${bet}.`;
    } else if (playerTotal === dealerTotal) {
      payout = bet;
      message = `Push at ${playerTotal}. Your bet is returned.`;
    } else message = `Dealer wins with ${dealerTotal}. You lose ${bet}.`;
    credits += payout;
    winEl.textContent = String(Math.max(0, payout - bet));
    messageEl.textContent = message;
    lastBet = bet;
    bet = 0;
    renderHud();
    if (credits <= 0) {
      phase = 'over';
      renderControls();
      window.setTimeout(() => showOverlay('Out of credits', `Your best total was ${best} credits.`, 'Play again'), 1200);
      return;
    }
    phase = 'bet';
    // Offer the same bet again when it is still affordable.
    if (lastBet <= credits) bet = lastBet;
    renderHud();
    renderControls();
    messageEl.textContent += ' Deal again or change your bet.';
  };

  const deal = async () => {
    if (phase !== 'bet' || bet === 0 || bet > credits) return;
    phase = 'dealing';
    credits -= bet;
    winEl.textContent = '0';
    dealer = [];
    player = [];
    holeHidden = true;
    dealerEl.replaceChildren();
    playerEl.replaceChildren();
    messageEl.textContent = 'Dealing...';
    renderHud();
    renderTotals();
    renderControls();
    const order: [Card[], HTMLElement, boolean][] = [
      [player, playerEl, false],
      [dealer, dealerEl, false],
      [player, playerEl, false],
      [dealer, dealerEl, true],
    ];
    for (const [hand, row, faceDown] of order) {
      const card = draw();
      hand.push(card);
      addCard(row, card, faceDown);
      renderTotals();
      await wait(DEAL_GAP_MS);
    }
    if (isBlackjack(player) || isBlackjack(dealer)) return settle();
    phase = 'player';
    messageEl.textContent = 'Hit, stand or double.';
    renderControls();
  };

  const hit = async () => {
    if (phase !== 'player') return;
    phase = 'dealing';
    renderControls();
    const card = draw();
    player.push(card);
    addCard(playerEl, card);
    renderTotals();
    await wait(DEAL_GAP_MS);
    if (total(player) >= 21) return settle();
    phase = 'player';
    messageEl.textContent = 'Hit or stand.';
    renderControls();
  };

  const double = async () => {
    if (phase !== 'player' || player.length !== 2 || credits < bet) return;
    credits -= bet;
    bet *= 2;
    renderHud();
    phase = 'dealing';
    renderControls();
    const card = draw();
    player.push(card);
    addCard(playerEl, card);
    renderTotals();
    await wait(DEAL_GAP_MS);
    settle();
  };

  const addChip = (value: number) => {
    if (phase !== 'bet' || bet + value > credits) return;
    bet += value;
    renderHud();
    renderControls();
  };

  /* The button keeps its visible "Play" label (the stager hover splits it into
     letters), so only its accessible name changes with the state. */
  const showOverlay = (title: string, text: string, button: string) => {
    titleEl.textContent = title;
    textEl.textContent = text;
    startBtn.setAttribute('aria-label', button);
    overlay.hidden = false;
    startBtn.focus({ preventScroll: true });
  };

  const start = () => {
    credits = START_CREDITS;
    bet = 0;
    lastBet = 0;
    dealer = [];
    player = [];
    dealerEl.replaceChildren();
    playerEl.replaceChildren();
    shuffle();
    phase = 'bet';
    overlay.hidden = true;
    winEl.textContent = '0';
    messageEl.textContent = 'Place your bet with the chips, then deal.';
    renderHud();
    renderTotals();
    renderControls();
  };

  startBtn.addEventListener('click', start);
  chipBtns.forEach((b) => b.addEventListener('click', () => addChip(Number(b.dataset.chip))));
  clearBtn.addEventListener('click', () => {
    bet = 0;
    renderHud();
    renderControls();
  });
  dealBtn.addEventListener('click', deal);
  hitBtn.addEventListener('click', hit);
  standBtn.addEventListener('click', () => phase === 'player' && settle());
  doubleBtn.addEventListener('click', double);

  window.addEventListener('keydown', (e) => {
    const target = e.target as HTMLElement;
    if (target.closest('input, textarea, select')) return;
    if (phase === 'player') {
      if (e.code === 'KeyH') hit();
      else if (e.code === 'KeyS') settle();
      else if (e.code === 'KeyD') double();
    } else if (phase === 'bet' && (e.code === 'Space' || e.code === 'Enter') && !target.closest('button')) {
      e.preventDefault();
      deal();
    }
  });

  renderControls();
}

initBlackjack();
/* Blackjack game END */
