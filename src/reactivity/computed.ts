import { effect, trigger } from './reactive';

// 计算函数
export function computed(getter: (...any: any[]) => any) {
  // 用来缓存上一次计算的值
  let value: any;
  // 标志，用来表示是否需要重新计算值，为 true 则表示需要重新计算
  let dirty = true;

  // 把 getter 作为一个副作用函数，创建一个 lazy 的 effect
  const effectFn = effect(getter, {
    lazy: true,
    // 添加调度器，在调度器中 dirty 重置为 true
    scheduler() {
      if (!dirty) {
        dirty = true;
        // 当计算属性依赖的响应式数据变化时，手动调用 trigger 函数触发响应
        trigger(obj, 'value', 'SET');
      }
    },
  });

  const obj = {
    // 当读取 value 时才执行 effectFn
    get value() {
      if (dirty) {
        value = effectFn();
        dirty = false;
      }
      // 当读取 value 时，收到调用 track 函数进行追踪
      trigger(obj, 'value', 'SET');
      return value;
    },
  };

  return obj;
}

export default computed;
