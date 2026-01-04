import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("Starting seed...")

  // Check if admin user already exists
  let admin = await prisma.users.findUnique({
    where: { email: "admin@example.com" },
  })

  if (admin) {
    console.log("Admin user already exists, skipping user creation...")
  } else {
    // Hash the password
    const hashedPassword = await bcrypt.hash("123456", 10)

    // Create admin user
    admin = await prisma.users.create({
      data: {
        name: "admin",
        email: "admin@example.com",
        password: hashedPassword,
        is_admin: true,
      },
    })

    console.log("Created admin user:", {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      is_admin: admin.is_admin,
    })
  }

  // Add Northwind database connection
  let northwindDb = await prisma.external_databases.findFirst({
    where: { name: "Northwind" },
  })

  if (northwindDb) {
    console.log("Northwind database already exists, skipping...")
  } else {
    northwindDb = await prisma.external_databases.create({
      data: {
        name: "Northwind",
        host: "localhost",
        port: 5434,
        database: "northwind",
        username: "postgres",
        password: "postgres",
        ssl_enabled: false,
        created_by: admin.id,
      },
    })

    console.log("Created Northwind database connection:", {
      id: northwindDb.id,
      name: northwindDb.name,
      host: northwindDb.host,
      port: northwindDb.port,
      database: northwindDb.database,
    })
  }

  // Seed custom charts
  const customChartsData = [
    {
      name: "Total Orders Over Time",
      sql: `SELECT
  TO_CHAR(order_date, 'YYYY-MM') AS month,
  COUNT(order_id) AS total_orders
FROM orders
GROUP BY month
ORDER BY month`,
      chart_config: {
        type: "line",
        title: "Total Orders Over Time",
        xAxis: { field: "month", label: "Month" },
        series: [{ field: "total_orders", label: "Total Orders" }],
      },
      created_by: admin.id,
      database_id: northwindDb.id,
    },
    {
      name: "Monthly Sales by Top 3 Product Categories",
      sql: `WITH CategorySales AS (
  SELECT
    c.category_name,
    SUM(od.unit_price * od.quantity * (
      1 - od.discount
    )) AS total_sales
  FROM order_details AS od
  JOIN products AS p
    ON od.product_id = p.product_id
  JOIN categories AS c
    ON p.category_id = c.category_id
  GROUP BY
    c.category_name
), TopCategories AS (
  SELECT
    category_name
  FROM CategorySales
  ORDER BY
    total_sales DESC
  LIMIT 3
)
SELECT
  TO_CHAR(o.order_date, 'YYYY-MM') AS month,
  c.category_name,
  SUM(od.unit_price * od.quantity * (
    1 - od.discount
  )) AS total_sales
FROM orders AS o
JOIN order_details AS od
  ON o.order_id = od.order_id
JOIN products AS p
  ON od.product_id = p.product_id
JOIN categories AS c
  ON p.category_id = c.category_id
WHERE
  c.category_name IN (
    SELECT
      category_name
    FROM TopCategories
  )
GROUP BY
  month,
  c.category_name
ORDER BY
  month,
  c.category_name`,
      chart_config: {
        type: "line",
        title: "Monthly Sales by Top 3 Product Categories",
        xAxis: { field: "month", label: "Month" },
        series: [{ field: "total_sales", label: "Total Sales" }],
        groupBy: { field: "category_name", valueField: "total_sales" },
      },
      created_by: admin.id,
      database_id: northwindDb.id,
    },
    {
      name: "Total Orders by Country",
      sql: `SELECT
  ship_country,
  COUNT(order_id) AS total_orders
FROM orders
GROUP BY
  ship_country
ORDER BY
  total_orders DESC`,
      chart_config: {
        type: "bar",
        title: "Total Orders by Country",
        xAxis: { field: "ship_country", label: "Country" },
        series: [{ field: "total_orders", label: "Total Orders" }],
      },
      created_by: admin.id,
      database_id: northwindDb.id,
    },
    {
      name: "Top 5 Employee Sales Performance by Year",
      sql: `WITH EmployeeSales AS (
  SELECT
    e.employee_id,
    e.first_name || ' ' || e.last_name AS employee_name,
    EXTRACT(
      YEAR
      FROM o.order_date
    ) AS year,
    SUM(od.unit_price * od.quantity * (
      1 - od.discount
    )) AS total_sales
  FROM employees AS e
  JOIN orders AS o
    ON e.employee_id = o.employee_id
  JOIN order_details AS od
    ON o.order_id = od.order_id
  GROUP BY
    e.employee_id,
    employee_name,
    year
), TopEmployees AS (
  SELECT
    employee_id
  FROM EmployeeSales
  GROUP BY
    employee_id
  ORDER BY
    SUM(total_sales) DESC
  LIMIT 5
)
SELECT
  es.employee_name,
  es.year,
  es.total_sales
FROM EmployeeSales AS es
WHERE
  es.employee_id IN (
    SELECT
      employee_id
    FROM TopEmployees
  )
ORDER BY
  es.employee_name,
  es.year`,
      chart_config: {
        type: "bar",
        title: "Top 5 Employee Sales Performance by Year",
        xAxis: { field: "employee_name", label: "Employee" },
        series: [{ field: "total_sales", label: "Total Sales" }],
        groupBy: { field: "year", valueField: "total_sales" },
      },
      created_by: admin.id,
      database_id: northwindDb.id,
    },
    {
      name: "Sales by Product Category",
      sql: `SELECT
  c.category_name,
  SUM(od.unit_price * od.quantity * (
    1 - od.discount
  )) AS total_sales
FROM order_details AS od
JOIN products AS p
  ON od.product_id = p.product_id
JOIN categories AS c
  ON p.category_id = c.category_id
GROUP BY
  c.category_name
ORDER BY
  total_sales DESC`,
      chart_config: {
        type: "pie",
        label: { field: "category_name" },
        title: "Sales by Product Category",
        value: { field: "total_sales" },
      },
      created_by: admin.id,
      database_id: northwindDb.id,
    },
  ]

  // Create custom charts
  const createdCharts: { id: bigint; name: string }[] = []
  for (const chartData of customChartsData) {
    const existingChart = await prisma.custom_charts.findFirst({
      where: { name: chartData.name, database_id: northwindDb.id },
    })

    if (existingChart) {
      console.log(`Custom chart "${chartData.name}" already exists, skipping...`)
      createdCharts.push({ id: existingChart.id, name: existingChart.name })
    } else {
      const chart = await prisma.custom_charts.create({
        data: chartData,
      })
      console.log(`Created custom chart: ${chart.name}`)
      createdCharts.push({ id: chart.id, name: chart.name })
    }
  }

  // Seed custom dashboard
  const existingDashboard = await prisma.custom_dashboards.findFirst({
    where: { name: "Example Dashboard" },
  })

  if (existingDashboard) {
    console.log("Example Dashboard already exists, skipping...")
  } else {
    // Map chart names to their IDs for the dashboard config
    const chartIdMap = new Map(createdCharts.map((c) => [c.name, c.id.toString()]))

    const dashboard = await prisma.custom_dashboards.create({
      data: {
        name: "Example Dashboard",
        render_config: {
          charts: [
            { width: "full", chartId: chartIdMap.get("Monthly Sales by Top 3 Product Categories") },
            { width: "half", chartId: chartIdMap.get("Total Orders Over Time") },
            { width: "half", chartId: chartIdMap.get("Sales by Product Category") },
            { width: "half", chartId: chartIdMap.get("Top 5 Employee Sales Performance by Year") },
            { width: "half", chartId: chartIdMap.get("Total Orders by Country") },
          ],
        },
        created_by: admin.id,
      },
    })

    console.log(`Created custom dashboard: ${dashboard.name}`)
  }

  console.log("Seed completed successfully!")
}

main()
  .catch((e) => {
    console.error("Error during seed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

