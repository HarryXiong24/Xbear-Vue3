import { reactive, effect } from '@/reactivity';

// 测试 computed 和 watch
export function array_test() {
  const arr = reactive([1, 2, 3]);

  effect(() => {
    console.log('array_tes, value', arr[1]);
    console.log('array_tes, length', arr.length);
  });

  effect(() => {
    for (const key in arr) {
      console.log('array_tes, for ... in', key);
    }
  });

  effect(() => {
    for (const val of arr.values()) {
      console.log('array_tes, for ... of', val);
    }
  });

  arr.length = 1;

  const obj = {};
  const arr2 = reactive([obj, '1', 1]);

  console.log(arr2.includes(obj));
  console.log(arr2.indexOf(1));

  const arr3 = reactive([]);
  effect(() => {
    arr3.push(1);
  });
  effect(() => {
    arr3.push(2);
  });
  effect(() => {
    console.log(arr3);
  });
}
