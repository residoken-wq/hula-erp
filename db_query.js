const { Client } = require('pg');
const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'hula_user',
  password: 'hula_password',
  database: 'hula_db'
});
client.connect()
  .then(() => client.query('SELECT id, month, year, employee_id, standard_work_days, actual_work_days, base_salary, actual_salary FROM payslips ORDER BY month DESC, year DESC LIMIT 10;'))
  .then(res => { console.table(res.rows); client.end(); })
  .catch(err => { console.error(err); client.end(); });
