import { computed, reactive } from '@/index';

// 测试 computed 和 watch
export function compute_test() {
  const obj = reactive({
    text: 'hello word',
    foo: 0,
    bar: 1,
  });

  const sum = computed(() => (obj.foo as number) + (obj.bar as number));
  console.log('compute_test, before operate', sum.value);

  obj.foo++;
  console.log('compute_test, after operate', sum.value);
}
