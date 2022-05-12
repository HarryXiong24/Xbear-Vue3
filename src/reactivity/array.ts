export const arrayInstrumentations: Record<string, any> = {};
['includes', 'indexOf', 'lastIndexOf'].forEach((method: string) => {
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const originMethod = Array.prototype[method as unknown as any];
  arrayInstrumentations[method] = function (
    ...args: [searchElement: any, fromIndex?: number | undefined]
  ) {
    // this 是代理对象，现在代理对象中查找，将结果存储到 res 中
    let res = originMethod.apply(this, args);

    if (res === false) {
      // res 为 false 说明没找到，通过 this.raw 拿到原始数组，再去其中查找并更新 res 的值
      res = originMethod.apply((this as unknown as any).raw, args);
    }
    return res;
  };
});
