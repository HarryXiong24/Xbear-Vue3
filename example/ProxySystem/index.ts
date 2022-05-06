import { reactive, computed, watch } from '@/reactivity';

export default function test() {
  const obj = reactive({
    text: 'hello word',
    foo: 0,
    bar: 1,
  });

  const sum = computed(() => (obj.foo as number) + (obj.bar as number));
  console.log('before operate', sum.value);

  watch(
    () => obj.foo,
    (newValue, oldValue) => {
      console.log(newValue, oldValue);
    },
    {
      immediate: false,
    }
  );
  obj.foo++;
  console.log('after operate', sum.value);
}
