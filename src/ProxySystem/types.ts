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

export type KeyMap = Map<string, Set<Effect>>;

export type TargetMap = WeakMap<Record<string, any>, KeyMap>;
