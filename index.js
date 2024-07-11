require("dotenv").config()

const db = require("./db")
const createTableIfNotExists = require("./utils/checkSchema")

const fetchData = async (page) => {
    const fetch = (await import("node-fetch")).default
    const url = `https://rickandmortyapi.com/api/character/?page=${page}`

    try {
        const response = await fetch(url)
        if (!response.ok) {
            throw new Error(`Ошибка запроса: ${response.statusText}`)
        }
        return await response.json()
    } catch (error) {
        console.error(`Ошибка выполнения fetch: ${error.message}`)
        return null
    }
}

const insertOrUpdateData = async (rows) => {
    for (const row of rows) {
        const query = `
      INSERT INTO ${process.env.DB_TABLE} (id, name, data) 
      VALUES ($1, $2, $3) 
      ON CONFLICT (id) 
      DO UPDATE SET name = EXCLUDED.name, data = EXCLUDED.data
    `
        const values = [row.id, row.name, row]
        try {
            await db.query(query, values)
        } catch (err) {
            console.error(`Ошибка вставки данных: ${err.stack}`)
        }
    }
}

const transferData = async (page) => {
    const data = await fetchData(page)
    if (data && data.results.length > 0) {
        await insertOrUpdateData(data.results)
        console.log(`Страница ${page} успешно перенесена.`)
        return data.info.pages
    } else {
        return 0
    }
}

const transfer = async () => {
    await createTableIfNotExists(process.env.DB_TABLE)

    // Получение первой страницы для определения количества страниц
    let totalPages = await transferData(1)
    for (let page = 2; page <= totalPages; page++) {
        await transferData(page)
    }
    console.log("Данные перенесены")
}

//Начало
const start = async () => {
    const isConnected = await db
        .connect()
        .then(() => {
            console.log("Подключение к базе данных установлено")
            return true
        })
        .catch((err) => {
            console.error("Ошибка подключения к базе данных", err.stack)
            return false
        })

    if (!isConnected) {
        return
    }
    transfer()
}

start()
