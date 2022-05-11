import { reactive, effect, shallowReactive } from './reactive';
import { computed } from './computed';
import { watch } from './watch';
import { proxyRefs, ref, toRef, toRefs } from './ref';

export {
  reactive,
  shallowReactive,
  computed,
  watch,
  ref,
  toRef,
  toRefs,
  proxyRefs,
  effect,
};
