/* eslint-disable @typescript-eslint/no-require-imports */
const postgres = require("postgres")

if (!process.env.DATABASE_URL) {
	throw new Error("DATABASE_URL não está definida. Confira seu .env.local")
}

const sql = postgres(process.env.DATABASE_URL, {
	max: 3,
	idle_timeout: 20,
	connect_timeout: 10,
	ssl: "require",
})

module.exports = { sql }