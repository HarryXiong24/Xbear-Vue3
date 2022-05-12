import { Effect, EffectOptions, TargetMap, TriggerType } from './types';

const arrayInstrumentations: Record<string, any> = {};

['includes', 'indexOf', 'lastIndexOf'].forEach((method: string) => {
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const originMethod = Array.prototype[method as unknown as any];
  arrayInstrumentations[method] = function (...args: any[]) {
    // this 是代理对象，现在代理对象中查找，将结果存储到 res 中
    let res = originMethod.apply(this, args);

    if (res === false) {
      // res 为 false 说明没找到，通过 this.raw 拿到原始数组，再去其中查找并更新 res 的值
      res = originMethod.apply((this as unknown as any).raw, args);
    }
    return res;
  };
});

let shouldTrack = true;

['push', 'pop', 'shift', 'unshift', 'splice'].forEach((method) => {
  const originMethod = Array.prototype[method as unknown as any];
  arrayInstrumentations[method] = function (...args: any[]) {
    shouldTrack = false;
    const res = originMethod.apply(this, args);
    shouldTrack = true;
    return res;
  };
});

// 存储代理对象的桶
const bucket: TargetMap = new WeakMap();
// 通用 effect
let activeEffect: Effect;
// effect 栈，用来保存嵌套的 effect
const effectStack: Effect[] = [];
// for ... in 代理的标志
const ITERATE_KEY = Symbol();

export function effect(
  fn: (...any: any[]) => any,
  options: EffectOptions = {}
) {
  const effectFn: Effect = () => {
    // 清楚遗留的副作用，防止不必要的更新
    cleanup(effectFn);
    // 当 effectFn 执行时，将其设置为当前激活的副作用函数
    activeEffect = effectFn;
    // 在调用副作用函数之前将当前副作用函数压入栈中
    // 栈的引入是为了解决 effect 嵌套执行问题
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

// 通过遍历副作用函数的 effectFn.deps 数组，将该副作用函数从依赖集合中删除，之后重置
export function cleanup(effectFn: Effect) {
  // 遍历 deps 数组
  for (let i = 0; i < effectFn.deps.length; i++) {
    const deps = effectFn.deps[i];
    deps.delete(effectFn);
  }
  effectFn.deps.length = 0;
}

// 用于 get 函数中追踪变化
export function track(target: Record<string, any>, key: string | symbol) {
  // 没有 activeEffect 直接返回
  if (!activeEffect || !shouldTrack) {
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
  // 将当前副作用函数存入依赖中，以作记录
  deps.add(activeEffect);
  // deps 就是一个与当前副作用函数存在练习的依赖集合
  // 将收集的依赖，绑定在当前 activeEffect 上
  activeEffect.deps.push(deps);
}

// 用于 set 函数中触发变化
export function trigger(
  target: Record<string, any>,
  key: string | symbol,
  type: TriggerType,
  newValue?: any
) {
  const depsMap = bucket.get(target);
  if (!depsMap) {
    return;
  }

  // 取得与 key 相关联的副作用函数
  const effects = depsMap.get(key);

  // 创建一个副本，否则会出现无限执行的情况
  const effectsToRun = new Set<Effect>();
  // 用来避免无限递归循环
  effects &&
    effects.forEach((effectFn) => {
      // 如果 trigger 触发执行的副作用函数与当前正在执行的副作用函数相同，则不触发执行
      if (effectFn !== activeEffect) {
        effectsToRun.add(effectFn);
      }
    });

  // 只有当操作类型为 ADD 或 DELETE 时，才触发与 ITERATE_KEY 相关联的副作用函数执行
  if (type === 'ADD' || type === 'DELETE') {
    // 取得与 ITERATE_KEY 相关联的副作用函数
    const iterateEffects = depsMap.get(ITERATE_KEY);

    // 将与 ITERATE_KEY 相关联的副作用函数也添加到 effectsToRun
    iterateEffects &&
      iterateEffects.forEach((effectFn) => {
        // 如果 trigger 触发执行的副作用函数与当前正在执行的副作用函数相同，则不触发执行
        if (effectFn !== activeEffect) {
          effectsToRun.add(effectFn);
        }
      });
  }

  // 只有当操作类型为 ADD 并且目标对象是数组的时候，应该取出并执行那些与 length 属性相关联的副作用函数
  if (type === 'ADD' && Array.isArray(target)) {
    // 取出与 length 相关联的副作用函数
    const lengthEffects = depsMap.get('length');

    // 将这些函数添加到 effectsToRun
    lengthEffects &&
      lengthEffects.forEach((effectFn) => {
        // 如果 trigger 触发执行的副作用函数与当前正在执行的副作用函数相同，则不触发执行
        if (effectFn !== activeEffect) {
          effectsToRun.add(effectFn);
        }
      });
  }

  // 如果操作目标是数组，并且修改了数组的 length 属性
  if (Array.isArray(target) && key === 'length') {
    // 对于索引大于或等于新的 length 元素，需要把所用相关联的副作用函数取出并添加到 effectsToRun 中待执行
    // eslint-disable-next-line @typescript-eslint/no-shadow
    depsMap.forEach((effects, key) => {
      if ((key as string) >= newValue) {
        effects.forEach((effectFn) => {
          if (effectFn !== activeEffect) {
            effectsToRun.add(effectFn);
          }
        });
      }
    });
  }

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
export function createReactive(
  data: Record<string, any>,
  isShallow = false,
  isReadonly = false
) {
  const obj: Record<string, any> = new Proxy(data, {
    // 代理读取
    get(target: Record<string, any>, key: string, receiver: any) {
      // 代理对象可通过 raw 属性访问原始数据
      if (key === 'raw') {
        return target;
      }

      // 如果操作的对象是数组，且 key 存在与 arrayInstrumentation 上，那么返回定义在 arrayInstrumentation 的值
      if (
        Array.isArray(target) &&
        (arrayInstrumentations as unknown as any).hasOwnProperty!(key)
      ) {
        return Reflect.get(arrayInstrumentations, key, receiver);
      }

      // 判断是否是只读的，不是才需要建立响应式联系
      // 还要判断是不是 symbol
      if (!isReadonly && typeof key !== 'symbol') {
        // 读取的时候，追踪这个属性
        track(target, key);
      }
      // 得到原始值的结果
      const res = Reflect.get(target, key, receiver);

      // 如果是浅响应，直接返回
      if (isShallow) {
        return res;
      }

      // 深响应
      if (typeof res === 'object' && res !== null) {
        // 深响应，让返回的对象仍然具有响应性
        // 同时要注意 readonly 也要进行深只读操作
        return isReadonly ? readonly(res) : reactive(res);
      }

      return res;
    },
    // 代理设置
    set(
      target: Record<string, any>,
      key: string,
      newValue: any,
      receiver: any
    ) {
      // 判断是否是只读的
      if (isReadonly) {
        console.warn(`This attribute ${key} is readonly!`);
        return true;
      }

      // 先获取旧值
      const oldValue = target[key];

      // 如果属性不存在，则说明是在添加新属性，否则是设置已有属性
      const type = Array.isArray(target)
        ? // 如果代理的目标是数组，则监测被设置的索引值是否小于数组长度
          // 如果是，则视作 SET 操作，否则是 ADD 操作
          Number(key) < target.length
          ? 'SET'
          : 'ADD'
        : Object.prototype.hasOwnProperty.call(target, key)
        ? 'SET'
        : 'ADD';
      // 设置属性值
      const res = Reflect.set(target, key, newValue, receiver);

      // 判断 receiver 是不是 target 的代理对象
      if (target === receiver.raw) {
        // 比较新旧值，不相等，并且都不是 NaN 的时候才触发响应
        if (
          oldValue !== newValue &&
          (oldValue === oldValue || newValue === newValue)
        ) {
          // 将 type 作为第三个属性值传给 trigger
          // 触发变化
          trigger(target, key, type, newValue);
        }
      }
      return res;
    },
    // 代理 xxx in obj
    has(target: Record<string, any>, key: string) {
      track(target, key);
      return Reflect.has(target, key);
    },
    // 代理 for ... in 循环
    ownKeys(target: Record<string, any>) {
      // 因为 ownKeys 操作的参数里没有第二个 key 参数，所以我们要自己构造一个
      // 将副作用函数与 ITERATE_KEY 关联
      track(target, Array.isArray(target) ? 'length' : ITERATE_KEY);
      return Reflect.ownKeys(target);
    },
    // 代理删除属性的操作
    deleteProperty(target: Record<string, any>, key: string) {
      // 判断是否是只读的
      if (isReadonly) {
        console.warn(`This attribute ${key} is readonly!`);
        return true;
      }
      // 检查被操作的属性是否是对象自己的属性
      const hadKey = Object.prototype.hasOwnProperty.call(target, key);
      // 完成删除操作
      const res = Reflect.deleteProperty(target, key);
      if (res && hadKey) {
        // 只有当被删除的属性是对象自己的属性并成功删除时，才触发更新
        trigger(target, key, 'DELETE');
      }
      return res;
    },
  });
  return obj;
}

export function reactive(obj: Record<string, any>) {
  return createReactive(obj);
}

export function shallowReactive(obj: Record<string, any>) {
  return createReactive(obj, true);
}

export function readonly(obj: Record<string, any>) {
  return createReactive(obj, false, true);
}

export function shallowReadonly(obj: Record<string, any>) {
  return createReactive(obj, true, true);
}
