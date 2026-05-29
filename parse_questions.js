const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'docs/template/hr/360_survey/360_questions.html');
const html = fs.readFileSync(filePath, 'utf8');

const rows = html.match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi);
if (!rows) {
    console.log("No rows found");
    process.exit(1);
}

const questions = [];

for (let i = 1; i < rows.length; i++) { 
    const row = rows[i];
    const cols = [];
    const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    let match;
    while ((match = tdRegex.exec(row)) !== null) {
        let text = match[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
        cols.push(text);
    }
    
    if (cols.length >= 5) {
        const id = cols[0];
        const category = cols[1];
        const doiTuong = cols[2];
        const khiaCanh = cols[3];
        const noidung = cols[4];
        
        if (category && noidung && id.startsWith('HULA_')) {
            questions.push({
                content: khiaCanh ? `${khiaCanh}: ${noidung}` : noidung,
                category: category,
                type: 'RATING'
            });
        }
    }
}

fs.writeFileSync(path.join(__dirname, 'parsed_questions.json'), JSON.stringify(questions, null, 2));
console.log('Parsed ' + questions.length + ' questions.');
