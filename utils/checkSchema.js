const client = require("../db")

async function checkIfTableExists(tableName) {
    const query = `
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = $1
    );
  `
    try {
        const res = await client.query(query, [tableName])
        const exists = res.rows[0].exists
        console.log(
            `Таблица "${tableName}" ${exists ? "существует" : "не существует"}.`
        )
        return exists
    } catch (err) {
        console.error("Ошибка выполнения запроса:", err.stack)
        throw err
    }
}

async function createTableIfNotExists(tableName) {
    const exists = await checkIfTableExists(tableName)
    if (!exists) {
        const createTableQuery = `
            CREATE TABLE ${process.env.DB_TABLE} (
                id SERIAL PRIMARY KEY,
                name TEXT,
                data JSONB
            )
        `

        try {
            await client.query(createTableQuery)
            console.log(`Таблица ${process.env.DB_TABLE} создана.`)
        } catch (err) {
            console.error("Ошибка создания таблицы:", err.stack)
        }
    }
}

module.exports = createTableIfNotExists
