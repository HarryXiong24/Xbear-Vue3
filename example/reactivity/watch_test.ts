import { reactive, watch } from '@/reactivity';

// 测试 computed 和 watch
export function watch_test() {
  const obj = reactive({
    text: 'hello word',
    foo: 0,
    bar: 1,
  });

  watch(
    () => obj.foo,
    (newValue, oldValue) => {
      console.log('watch_test, foo', newValue, oldValue);
    },
    {
      immediate: false,
    }
  );

  watch(
    () => obj.bar,
    (newValue, oldValue) => {
      console.log('watch_test, bar', newValue, oldValue);
    },
    {
      immediate: true,
    }
  );

  obj.foo++;
}
