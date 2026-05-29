const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'parsed_questions.json'), 'utf8'));

let sql = '-- Auto-generated seed file for 360-degree review questions\n';
sql += 'INSERT INTO review_question (content, category, type, created_at, updated_at) VALUES\n';

const values = data.map(q => {
    const content = q.content.replace(/'/g, "''");
    const category = q.category.replace(/'/g, "''");
    return `('${content}', '${category}', '${q.type}', NOW(), NOW())`;
});

sql += values.join(',\n') + ';\n';

fs.writeFileSync(path.join(__dirname, 'docs/template/hr/360_survey/import_questions.sql'), sql);
console.log('SQL generated!');
