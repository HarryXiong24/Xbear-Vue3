import { reactive, shallowReactive, effect } from '@/reactivity';

// 测试 computed 和 watch
export function shallowReactive_test() {
  const deep = reactive({
    foo: { bar: 1 },
  });

  const shallow = shallowReactive({
    foo: { bar: 1 },
  });

  effect(() => {
    console.log('reactive_test', deep.foo.bar);
  });

  effect(() => {
    console.log('shallowReactive_test', shallow.foo.bar);
  });

  deep.foo.bar++;
  shallow.foo.bar++;
}
