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