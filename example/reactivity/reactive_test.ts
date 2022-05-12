import { reactive, effect } from '@/reactivity';

// 测试 computed 和 watch
export function reactive_test() {
  const obj = reactive({
    text: 'hello word',
    foo: 0,
    bar: 1,
  });

  effect(() => {
    console.log('reactive_test, obj.foo', obj.foo);
  });

  effect(() => {
    console.log('reactive_test, in', 'foo' in obj);
  });

  effect(() => {
    for (const key in obj) {
      console.log('reactive_test', key, obj[key]);
    }
  });

  obj.foo++;
}
