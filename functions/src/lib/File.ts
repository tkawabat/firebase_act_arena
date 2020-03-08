import * as fs from 'fs-extra';


export const readFile = (path: string) => {
    let lines: Array<String> = [];
    try {
        const text = fs.readFileSync(path, 'utf-8');
        lines = text.split('\r\n');
    } catch (error) {
        console.log(`failed to read ${error}`)
    }
    lines.shift();
    return lines;        
}