export interface Effect {
  (...any: any[]): any;
  deps: Array<Set<(...any: any[]) => any>>;
  options: EffectOptions;
}

export interface EffectOptions {
  scheduler?: (...any: any[]) => any;
  lazy?: boolean;
}

export interface WatchOptions {
  immediate?: boolean;
}

export type KeyMap = Map<string | symbol, Set<Effect>>;

export type TargetMap = WeakMap<Record<string, any>, KeyMap>;

export type TriggerType = 'SET' | 'ADD' | 'DELETE';
