import { reactive } from './reactive';

// 实现原始值的响应式
export function ref(value: any): { value: any } {
  const wrapper = {
    value,
  };
  // 使用 Object.defineProperty 在 wrapper 对象上定义一个不可枚举不可写的属性 __v_isRef，并且值为 true
  // true 表示这个对象是一个 ref
  Object.defineProperty(wrapper, '__v_isRef', {
    value: true,
  });
  return reactive(wrapper) as { value: any };
}

// 用于为响应式对象上的 property 创建 ref
// 这样创建的 ref 与其源 property 保持同步：改变源 property 将更新 ref，反之亦然。
export function toRef(obj: Record<string, any>, key: string) {
  const wrapper = {
    get value() {
      return obj[key];
    },
    set value(newValue: any) {
      obj[key] = newValue;
    },
  };
  // 使用 Object.defineProperty 在 wrapper 对象上定义一个不可枚举不可写的属性 __v_isRef，并且值为 true
  // true 表示这个对象是一个 ref
  Object.defineProperty(wrapper, '__v_isRef', {
    value: true,
  });
  return wrapper;
}

// 将一个响应式对象转换为一个普通对象
// 这个普通对象的每个 property 都是指向源对象相应 property 的 ref
// 每个单独的 ref 都是使用 toRef() 创建的
export function toRefs(obj: Record<string, any>) {
  const ret: Record<string, any> = {};
  for (const key in obj) {
    // 逐个属性调用 toRef 完成转换
    ret[key] = toRef(obj, key);
  }
  return ret;
}

// 自动脱 ref
// 由于 toRefs 会把第一层属性值转换为 ref，所以必须通过 value 属性访问值
export function proxyRefs(obj: Record<string, any>) {
  return new Proxy(obj, {
    get(target: Record<string, any>, key: string, receiver: any) {
      const value = Reflect.get(target, key, receiver);
      // 自动脱 ref
      return value.__v_isRef ? value.value : value;
    },
    set(
      target: Record<string, any>,
      key: string,
      newValue: any,
      receiver: any
    ) {
      // 用过 target 读取真实值
      const value = target[key];
      // 如果值是 ref，则设置其对应的 value 属性值
      if (value.__v_isRef) {
        value.value = newValue;
        return true;
      }
      return Reflect.set(target, key, newValue, receiver);
    },
  });
}
