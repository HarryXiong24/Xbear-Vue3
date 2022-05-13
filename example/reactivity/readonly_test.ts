import { readonly, shallowReadonly } from '@/index';

// 测试 computed 和 watch
export function readonly_test() {
  const deep = readonly({
    foo: { bar: 1 },
  });

  const shallow = shallowReadonly({
    foo: { bar: 1 },
  });

  deep.foo.bar = 2;
  shallow.foo.bar = 2;
  console.log('readonly_test', deep.foo.bar);
  console.log('shallowReadonly_test', shallow.foo.bar);
}
