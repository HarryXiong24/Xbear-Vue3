import { Effect, EffectOptions, TargetMap } from './types';

// 存储代理对象的桶
const bucket: TargetMap = new WeakMap();

// 通用 effect
let activeEffect: Effect;
// effect 栈，用来保存嵌套的 effect
const effectStack: Effect[] = [];

export function effect(
  fn: (...any: any[]) => any,
  options: EffectOptions = {}
) {
  const effectFn: Effect = () => {
    cleanup(effectFn);
    // 当 effectFn 执行时，将其设置为当前激活的副作用函数
    activeEffect = effectFn;
    // 在调用副作用函数之前将当前副作用函数压入栈中
    effectStack.push(effectFn);
    // 将 fn 的执行结果储存到 res 中
    const res = fn();
    // 在当前副作用函数执行完毕之后，将当前副作用函数弹出栈，并把 activeEffect 还原为之前的值
    effectStack.pop();
    activeEffect = effectStack[effectStack.length - 1];
    // 将 res 作用 effectFn 的返回值
    return res;
  };
  // 将 options 挂载到 effectFn 上
  effectFn.options = options;
  // activeEffect.deps 用来存储所有与该副作用函数想关联的依赖集合
  effectFn.deps = [];
  // 只有 lazy 为 false 的时候，才立即执行副作用函数
  if (!options.lazy) {
    // 执行副作用函数
    effectFn();
  }
  // 否则将副作用函数作为返回值返回
  // 作为返回值返回，则需要手动触发
  return effectFn;
}

export function cleanup(effectFn: Effect) {
  // 遍历 deps 数组
  for (let i = 0; i < effectFn.deps.length; i++) {
    const deps = effectFn.deps[i];
    deps.delete(effectFn);
  }
  effectFn.deps.length = 0;
}

// 用于 get 函数中追踪变化
export function track(target: Record<string, any>, key: string) {
  // 没有 activeEffect 直接返回
  if (!activeEffect) {
    return;
  }
  // 从 WeakMap 中取出当前对象（更新时情况）
  let depsMap = bucket.get(target);
  // 如果没有则新建（第一次时情况）
  if (!depsMap) {
    bucket.set(target, (depsMap = new Map<string, Set<Effect>>()));
  }
  // 取出指定对象属性里的 effects list
  let deps = depsMap.get(key);
  // 没有则新建
  if (!deps) {
    depsMap.set(key, (deps = new Set<Effect>()));
  }
  // 将当前副作用函数存入
  deps.add(activeEffect);
  // deps 就是一个与当前副作用函数存在练习的依赖集合
  activeEffect.deps.push(deps);
}

// 用于 set 函数中触发变化
export function trigger(target: Record<string, any>, key: string) {
  const depsMap = bucket.get(target);
  if (!depsMap) {
    return;
  }
  const effects = depsMap.get(key);

  // 创建一个副本，否则会出现无限执行的情况
  const effectsToRun = new Set<Effect>();
  effects &&
    effects.forEach((effectFn) => {
      // 如果 trigger 触发执行的副作用函数与当前正在执行的副作用函数相同，则不触发执行
      if (effectFn !== activeEffect) {
        effectsToRun.add(effectFn);
      }
    });
  // 把收集的副作用都执行一遍
  effectsToRun.forEach((effectFn) => {
    // 如果一个副作用函数存在调度器，则调用该调度器，并将副作用函数作为参数传递
    if (effectFn.options.scheduler) {
      effectFn.options.scheduler(effectFn);
    } else {
      // 否则直接执行副作用函数
      effectFn();
    }
  });
}

// 代理
// WeakMap: target --> Map
// Map: key --> Set(effects list)
export function reactive(data: Record<string, any>) {
  const obj = new Proxy(data, {
    get(target: Record<string, any>, key: string) {
      track(target, key);
      return target[key];
    },
    set(target: Record<string, any>, key: string, newValue: any) {
      target[key] = newValue;
      trigger(target, key);
      return true;
    },
  });
  return obj;
}
