为这个项目添加示例数据库，使用 northwind 的数据

## 构建 docker file

在/northwind-database 文件夹下，维护一个 dockerfile，使用最轻量的镜像来启动一个 postgres 15 数据库，并使用 northwind.sql 的数据进行初始化

## 一键启动脚本

- 在项目根目录下，维护一个 start.sh 脚本
- 首先启动 system-db (localhost:5433) 数据库，再启动 northwind-db (localhost:5434) 数据库，最后使用`bun run dev`启动 agent 项目
- 如果 system-db 没有初始化，需要初始化并 seed 数据
- 如果没有 bun，尝试使用 pnpm 或 npm

## 更新 README.md

- 说明如何使用 start.sh 脚本启动项目
- 说明如何单独启动此项目开发环境，和单独启动 northwind 数据库和 system 数据库

## 更新 seed 文件

在 prisma/seed.ts 文件中，给 external_databases 表添加一条数据，用于连接 northwind 数据库
