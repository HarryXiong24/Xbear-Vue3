import { reactive_test } from './reactive_test';
import { compute_test } from './compute_test';
import { watch_test } from './watch_test';
import { shallowReactive_test } from './shallowReactive_test';
import { ref_test, toRefs_test, toRef_test } from './ref_test';

export default function test() {
  reactive_test();
  compute_test();
  watch_test();
  shallowReactive_test();
  ref_test();
  toRef_test();
  toRefs_test();
}
