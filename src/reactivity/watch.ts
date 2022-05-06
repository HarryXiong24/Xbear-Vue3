import { effect } from './reactive';
import { WatchOptions } from './types';

// 读取对象上的任意属性，使得任意属性发生变化的时候都能够触发回调函数的执行
function traverse(value: Record<string, any>, seen = new Set()) {
  // 如果要读取的数据是原始值，或者已经被读取过了，那么什么都不会做
  if (typeof value !== 'object' || value === null || seen.has(value)) {
    return;
  }
  // 将数据添加到 seen 中，代表遍历读取过了，避免循环引用引起的死循环
  seen.add(value);
  // 暂时不考虑数组等其他结构，假设 value 就是一个对象
  for (const k in value) {
    traverse(value[k], seen);
  }
  return value;
}

// watch 函数
// watch 可以接受一个响应式数据或者一个 getter 函数
export function watch(
  source: any,
  cb: (
    newValue?: any,
    oldValue?: any,
    onInvalidDate?: any,
    ...any: any[]
  ) => any,
  options: WatchOptions = {}
) {
  let getter: any;
  if (typeof source === 'function') {
    getter = source;
  } else {
    getter = () => traverse(source);
  }
  // 定义新值和旧值
  let oldValue: any;
  let newValue: any;
  // 用来存储用户注册的过期回调
  let cleanup: any;
  function onInvalidDate(fn: (...any: any[]) => any) {
    // 将过期的回调存储到 cleanup 中
    cleanup = fn;
  }
  const job = () => {
    newValue = effectFn();
    // 在调用回调函数 cb 之前，先调用过期的回调
    if (cleanup) {
      cleanup();
    }
    // 当数据变化时，调用回调函数 cb
    // 同时将旧值和新值作用回调函数的参数
    cb(newValue, oldValue, onInvalidDate);
    // 更新旧值，不然下一次会得到错误的旧值
    oldValue = newValue;
  };
  const effectFn = effect(
    // 调用 traverse 函数递归读取
    () => getter(),
    {
      lazy: true,
      scheduler: job,
    }
  );
  if (options.immediate) {
    // 立即触发回调函数
    job();
  } else {
    // 手动调用副作用函数，拿到的就是旧值
    oldValue = effectFn();
  }
}

export default watch;
