将这个项目改成可以连接外部数据库的版本

## 系统数据库

维护在 schema.prisma 中，保存这个 app 需要的数据

## 外部数据库

在系统数据库中添加一个表，保存外部数据库的连接信息

添加一个单独的页面让用户管理外部数据库的连接信息，支持查看、添加、编辑、删除

## 旧功能改造

旧功能例如 data studio、agent chat，都是基于系统数据库的连接，因此需要改造为支持动态切换外部数据库

### 选择数据库

参考`components/sidebar/team-switcher.tsx`，抽取一个 DatabaseSwitcher 组件，用于选择外部数据库，如果为空，则提示创建外部数据库连接

### 全局数据库状态

选择的数据库会作用到 data studio、agent chat 等旧功能中，使用 zustand 实现全局数据库状态管理

### 旧功能改造

改造 data studio、agent chat 等旧功能相关 api，在参数中传递当前的外部数据库 id
