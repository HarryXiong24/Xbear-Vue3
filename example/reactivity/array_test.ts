import { reactive, effect } from '@/reactivity';

// 测试 computed 和 watch
export function array_test() {
  const arr = reactive([1, 2, 3]);

  effect(() => {
    console.log('array_tes, value', arr[100]);
    console.log('array_tes, length', arr.length);
  });

  arr.length = 0;
}
