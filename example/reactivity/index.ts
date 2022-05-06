import {
  reactive,
  computed,
  watch,
  effect,
  ref,
  toRef,
  toRefs,
  proxyRefs,
} from '@/reactivity';

export default function test() {
  reactiveTest();
  refTest();
  toRefTest();
  toRefsTest();
}

// 测试 computed 和 watch
function reactiveTest() {
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

// 测试 ref
function refTest() {
  const refVal = ref(100);
  effect(() => {
    console.log('refVal', refVal.value);
  });
  refVal.value++;
}

// 测试 toRef
function toRefTest() {
  const obj = reactive({
    foo: 0,
    bar: 1,
  });

  const foo = toRef(obj, 'foo');

  effect(() => {
    console.log('foo', foo.value);
    console.log('obj.foo', obj.foo);
  });

  foo.value++;
}

// 测试 toRefs
function toRefsTest() {
  const obj = reactive({
    foo: 0,
    bar: 1,
  });

  const newObj = toRefs(obj);
  // 脱 ref 模式
  // 在 Vue 中，setup 函数返回的数据会传递给 proxyRefs 函数脱 ref，所以在模板中使用不需要加 value
  // const newObj = proxyRefs(toRefs(obj));

  effect(() => {
    console.log('newObj', newObj.foo.value, newObj.bar.value);
  });

  obj.foo++;
}
