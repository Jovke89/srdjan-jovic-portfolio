/* Game Room catalogue, shared by /game-room/ and every game page's "Try other
   games" section. Each game lives at /game-room/<slug>/ with its cover in
   public/game-room/. Add a game here and it shows up everywhere. */
export interface Game {
  slug: string;
  title: string;
  text: string;
  cover: string;
}

export const GAMES: Game[] = [
  {
    slug: 'pinball',
    title: 'Agent Pinball',
    text: 'Flip the ball into the AI agent bumpers, spell SRDJAN for a bigger multiplier and earn an extra ball.',
    cover: '/game-room/pinball.svg',
  },
  {
    slug: 'blackjack',
    title: 'Blackjack',
    text: 'Beat the dealer to 21. Start with 1000 credits and bet with 50, 100, 500 and 1000 chips.',
    cover: '/game-room/blackjack.svg',
  },
  {
    slug: 'space-defender',
    title: 'Space Defender',
    text: 'Pilot the ship and blast the invaders before they reach the ground.',
    cover: '/game-room/space.svg',
  },
  {
    slug: 'tanks',
    title: 'Tank Battle',
    text: 'Protect the agent through 5 levels of enemy tanks. Grab weapon crates and keep the base walls standing.',
    cover: '/game-room/tanks.svg',
  },
  {
    slug: 'tetris',
    title: 'Tetris',
    text: 'The falling blocks classic. Clear lines, hold a piece for later and survive the speed up.',
    cover: '/game-room/tetris.svg',
  },
  {
    slug: 'snake',
    title: 'Snake',
    text: 'The Nokia 3310 classic. Eat, grow, and never bite your own tail.',
    cover: '/game-room/snake.svg',
  },
  {
    slug: 'star-breaker',
    title: 'Star Breaker',
    text: 'Break every brick, catch the power-ups and dodge the rockets falling from the sky.',
    cover: '/game-room/star-breaker.svg',
  },
];

export const gameUrl = (slug: string) => `/game-room/${slug}/`;
