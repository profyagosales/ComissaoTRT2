/* eslint-disable @typescript-eslint/no-require-imports */
const { sql } = require("../db")

async function main() {
  try {
    const [nowRow] = await sql`select now() as now`
    console.log("✅ Conectado! now() =", nowRow.now)

    const resumo = await sql`
      select
        sistema_concorrencia,
        count(*) as total
      from candidates
      group by sistema_concorrencia
      order by sistema_concorrencia
    `

    console.log("📊 Candidates por sistema:")
    for (const row of resumo) {
      console.log(` - ${row.sistema_concorrencia}: ${row.total}`)
    }
  } catch (err) {
    console.error("❌ Erro ao consultar o banco:")
    console.error(err)
  } finally {
    await sql.end({ timeout: 5 })
  }
}

main()
