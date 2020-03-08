import * as ArrayUtil from '../ArrayUtil';

describe('Array.batch', () => {
    it('正常系', () => {
        const input = [];
        for (let i = 0; i < 5; i++) input.push(i);

        const g = ArrayUtil.batchGenerator(input, 2);
        expect(g.next().value).toStrictEqual([0,1]);
        expect(g.next().value).toStrictEqual([2,3]);
        expect(g.next().value).toStrictEqual([4]);
        expect(g.next().done).toBe(true);
    });
    it('サイズ以下', () => {
        const input = [];
        for (let i = 0; i < 5; i++) input.push(i);

        const g = ArrayUtil.batchGenerator(input, 10);
        expect(g.next().value).toStrictEqual([0,1,2,3,4]);
        expect(g.next().done).toBe(true);
    });
    it('0件', () => {
        const input :Array<any> = [];

        const g = ArrayUtil.batchGenerator(input, 2);
        expect(g.next().done).toBe(true);
    });
});