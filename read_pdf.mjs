import fs from 'fs';
import pdf from 'pdf-parse/lib/pdf-parse.js';

const dataBuffer = fs.readFileSync('c:/Users/LENOVO/.gemini/antigravity/scratch/INTIMORA/INTIMORA.pdf');

pdf(dataBuffer).then(function(data) {
    console.log("PDF TEXT EXTRACTED:");
    console.log(data.text);
}).catch(err => {
    console.error("ERROR:");
    console.error(err);
});
