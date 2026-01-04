在 seed 时初始化 custom charts 和 dashboards

## Dashboards

```json
[
  {
    "id": 1,
    "name": "Example Dashboard",
    "render_config": {
      "charts": [
        { "width": "full", "chartId": "2" },
        { "width": "half", "chartId": "1" },
        { "width": "half", "chartId": "5" },
        { "width": "half", "chartId": "4" },
        { "width": "half", "chartId": "3" }
      ]
    },
    "created_by": 1
  }
]
```

## Custom Charts

```json
[
  {
    "id": 1,
    "name": "Total Orders Over Time",
    "sql": "SELECT\n  TO_CHAR(order_date, 'YYYY-MM') AS month,\n  COUNT(order_id) AS total_orders\nFROM orders\nGROUP BY month\nORDER BY month",
    "chart_config": {
      "type": "line",
      "title": "Total Orders Over Time",
      "xAxis": { "field": "month", "label": "Month" },
      "series": [{ "field": "total_orders", "label": "Total Orders" }]
    },
    "created_by": 1,
    "database_id": 1
  },
  {
    "id": 2,
    "name": "Monthly Sales by Top 3 Product Categories",
    "sql": "WITH CategorySales AS (\n  SELECT\n    c.category_name,\n    SUM(od.unit_price * od.quantity * (\n      1 - od.discount\n    )) AS total_sales\n  FROM order_details AS od\n  JOIN products AS p\n    ON od.product_id = p.product_id\n  JOIN categories AS c\n    ON p.category_id = c.category_id\n  GROUP BY\n    c.category_name\n), TopCategories AS (\n  SELECT\n    category_name\n  FROM CategorySales\n  ORDER BY\n    total_sales DESC\n  LIMIT 3\n)\nSELECT\n  TO_CHAR(o.order_date, 'YYYY-MM') AS month,\n  c.category_name,\n  SUM(od.unit_price * od.quantity * (\n    1 - od.discount\n  )) AS total_sales\nFROM orders AS o\nJOIN order_details AS od\n  ON o.order_id = od.order_id\nJOIN products AS p\n  ON od.product_id = p.product_id\nJOIN categories AS c\n  ON p.category_id = c.category_id\nWHERE\n  c.category_name IN (\n    SELECT\n      category_name\n    FROM TopCategories\n  )\nGROUP BY\n  month,\n  c.category_name\nORDER BY\n  month,\n  c.category_name",
    "chart_config": {
      "type": "line",
      "title": "Monthly Sales by Top 3 Product Categories",
      "xAxis": { "field": "month", "label": "Month" },
      "series": [{ "field": "total_sales", "label": "Total Sales" }],
      "groupBy": { "field": "category_name", "valueField": "total_sales" }
    },
    "created_by": 1,
    "database_id": 1
  },
  {
    "id": 3,
    "name": "Total Orders by Country",
    "sql": "SELECT\n  ship_country,\n  COUNT(order_id) AS total_orders\nFROM orders\nGROUP BY\n  ship_country\nORDER BY\n  total_orders DESC",
    "chart_config": {
      "type": "bar",
      "title": "Total Orders by Country",
      "xAxis": { "field": "ship_country", "label": "Country" },
      "series": [{ "field": "total_orders", "label": "Total Orders" }]
    },
    "created_by": 1,
    "database_id": 1
  },
  {
    "id": 4,
    "name": "Top 5 Employee Sales Performance by Year",
    "sql": "WITH EmployeeSales AS (\n  SELECT\n    e.employee_id,\n    e.first_name || ' ' || e.last_name AS employee_name,\n    EXTRACT(\n      YEAR\n      FROM o.order_date\n    ) AS year,\n    SUM(od.unit_price * od.quantity * (\n      1 - od.discount\n    )) AS total_sales\n  FROM employees AS e\n  JOIN orders AS o\n    ON e.employee_id = o.employee_id\n  JOIN order_details AS od\n    ON o.order_id = od.order_id\n  GROUP BY\n    e.employee_id,\n    employee_name,\n    year\n), TopEmployees AS (\n  SELECT\n    employee_id\n  FROM EmployeeSales\n  GROUP BY\n    employee_id\n  ORDER BY\n    SUM(total_sales) DESC\n  LIMIT 5\n)\nSELECT\n  es.employee_name,\n  es.year,\n  es.total_sales\nFROM EmployeeSales AS es\nWHERE\n  es.employee_id IN (\n    SELECT\n      employee_id\n    FROM TopEmployees\n  )\nORDER BY\n  es.employee_name,\n  es.year",
    "chart_config": {
      "type": "bar",
      "title": "Top 5 Employee Sales Performance by Year",
      "xAxis": { "field": "employee_name", "label": "Employee" },
      "series": [{ "field": "total_sales", "label": "Total Sales" }],
      "groupBy": { "field": "year", "valueField": "total_sales" }
    },
    "created_by": 1,
    "database_id": 1
  },
  {
    "id": 5,
    "name": "Sales by Product Category",
    "sql": "SELECT\n  c.category_name,\n  SUM(od.unit_price * od.quantity * (\n    1 - od.discount\n  )) AS total_sales\nFROM order_details AS od\nJOIN products AS p\n  ON od.product_id = p.product_id\nJOIN categories AS c\n  ON p.category_id = c.category_id\nGROUP BY\n  c.category_name\nORDER BY\n  total_sales DESC",
    "chart_config": {
      "type": "pie",
      "label": { "field": "category_name" },
      "title": "Sales by Product Category",
      "value": { "field": "total_sales" }
    },
    "created_by": 1,
    "database_id": 1
  }
]
```
