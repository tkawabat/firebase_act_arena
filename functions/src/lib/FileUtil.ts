import * as fs from 'fs-extra';


export const readFile = (path: string, header: boolean) => {
    let lines: Array<String> = [];
    try {
        const text = fs.readFileSync(path, 'utf-8');
        lines = text.split('\r\n');
    } catch (error) {
        console.log(`failed to read ${error}`)
    }

    if (header) {
        lines.shift();
    }
    return lines;
}