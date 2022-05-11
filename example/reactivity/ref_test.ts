import { effect, reactive, ref, toRef, toRefs } from '@/reactivity';

// 测试 ref
export function ref_test() {
  const refVal = ref(100);
  effect(() => {
    console.log('refVal', refVal.value);
  });
  refVal.value++;
}

// 测试 toRef
export function toRef_test() {
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
export function toRefs_test() {
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
