export function shuffle(list: Array<any>): Array<any> {
    const copied = list.slice();
    for (let i = copied.length - 1; i > 0; i--) {
        const r = Math.floor(Math.random() * (i + 1));
        const tmp = copied[i];
        copied[i] = copied[r];
        copied[r] = tmp;
    }
    return copied;
}

export function* batchGenerator(data: Array<any>, size:number) {
    let n = 0;
    while (n < data.length) {
        yield data.slice(n, n + size);
        n += size;
    }
}