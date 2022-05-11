import { reactive } from '@/reactivity';
import { effect } from '../../src/reactivity/reactive';

// 测试 computed 和 watch
export function reactive_test() {
  const obj = reactive({
    text: 'hello word',
    foo: 0,
    bar: 1,
  });

  effect(() => {
    console.log('reactive_test', obj.foo);
  });

  obj.foo++;
}
