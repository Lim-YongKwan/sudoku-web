/** Shared contracts. Board length/digit constraints still require runtime validation. */
export type Board = readonly number[];
export type Difficulty = 'easy' | 'normal' | 'hard';
export type Direction = 'up' | 'down' | 'left' | 'right';
export type Clock = () => number;
export type YieldControl = () => Promise<void>;
export interface SearchOptions {
  now?: Clock; yieldControl?: YieldControl; rng?: () => number; signal?: AbortSignal;
  maxNodes?: number; maxElapsedMs?: number; yieldEveryNodes?: number; limit?: number;
}
export interface GenerateOptions extends SearchOptions {
  maxAttempts?: number; maxTotalNodes?: number; maxNodesPerSearch?: number;
}
export interface SearchStats { nodes: number; elapsedMs: number }
export type StopReason = 'aborted' | 'time-budget' | 'node-budget';
export interface SharedBudget { now: Clock; startedAt: number; maxElapsedMs: number; maxNodes: number; nodes: number }
export type SearchStatus = 'solved' | 'unsolvable' | 'invalid' | 'aborted' | 'budget-exceeded' | 'complete' | 'limit-reached';
export interface SearchResult {
  status: SearchStatus; count: number; board: number[] | null; stats: SearchStats; reason: StopReason | null;
}
export type SolveResult =
  | { status: 'solved'; board: Board; stats: SearchStats }
  | { status: 'unsolvable' | 'invalid' | 'aborted' | 'budget-exceeded'; board: null; stats: SearchStats };
export interface CountResult { status: 'complete' | 'limit-reached' | 'invalid' | 'aborted' | 'budget-exceeded'; count: number; stats: SearchStats }
export interface GenerationStats { attempts: number; totalNodes: number; elapsedMs: number }
export type GenerateResult =
  | { status: 'success'; puzzle: Board; difficulty: Difficulty; blankCount: number; stats: GenerationStats }
  | { status: 'failed'; reason: 'time-budget' | 'node-budget' | 'attempts-exhausted'; stats: GenerationStats }
  | { status: 'aborted'; stats: GenerationStats };
export type Generate = (difficulty: Difficulty, options?: GenerateOptions) => Promise<GenerateResult>;
export interface Timer { readonly startedAtMs: number | null; readonly stoppedAtMs: number | null }
export interface GameState {
  readonly status: 'idle' | 'generating' | 'playing' | 'completed' | 'error';
  readonly puzzle: Board | null; readonly values: Board | null;
  readonly notes: readonly ReadonlySet<number>[]; readonly selectedIndex: number | null;
  readonly noteMode: boolean; readonly selectedDifficulty: Difficulty; readonly activeDifficulty: Difficulty | null;
  readonly requestId: number; readonly timer: Timer; readonly completionDialogOpen: boolean;
  readonly error: { readonly code: string; readonly message: string } | null;
}
export type Action =
  | { type: 'SET_DIFFICULTY'; difficulty: Difficulty }
  | { type: 'NEW_GAME_REQUESTED'; requestId: number; difficulty: Difficulty }
  | { type: 'GENERATION_SUCCEEDED'; requestId: number; difficulty: Difficulty; puzzle: Board; nowMs: number }
  | { type: 'GENERATION_FAILED'; requestId: number; code: string; message: string }
  | { type: 'SELECT_CELL'; index: number }
  | { type: 'MOVE_SELECTION'; direction: Direction }
  | { type: 'ENTER_DIGIT'; digit: number }
  | { type: 'GAME_COMPLETED'; nowMs: number }
  | { type: 'CLEAR_CELL' }
  | { type: 'TOGGLE_NOTE_MODE' }
  | { type: 'CLOSE_COMPLETION_DIALOG' };
export type Listener = (state: GameState) => void;
export type Dispatch = (action: Action) => GameState;
export interface GameStore { getState(): GameState; dispatch: Dispatch; subscribe(listener: Listener): () => void }
