const fs = require('fs');
const pdf = require('pdf-parse');

const dataBuffer = fs.readFileSync('c:/Users/LENOVO/.gemini/antigravity/scratch/INTIMORA/INTIMORA.pdf');

pdf(dataBuffer).then(function(data) {
    console.log("PDF TEXT EXTRACTED:");
    console.log(data.text);
}).catch(err => {
    console.error("ERROR:");
    console.error(err);
});
