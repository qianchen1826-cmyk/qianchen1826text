# 副业试跑站部署说明

## 1. Supabase

1. 创建 Supabase 项目。
2. 在 SQL Editor 执行 [`supabase-schema.sql`](./supabase-schema.sql)。
3. 在 Authentication -> Users 中创建管理员邮箱和密码。
4. 执行下面的 SQL，把管理员用户加入后台白名单。将 `YOUR_AUTH_USER_UUID` 替换成该用户的 UUID。

```sql
insert into public.admin_users (user_id)
values ('YOUR_AUTH_USER_UUID')
on conflict (user_id) do nothing;
```

5. 在 Project Settings -> API 复制 Project URL 和 publishable/anon key，填写到 [`supabase-config.js`](./supabase-config.js)。

## 2. GitHub Pages

1. 在 GitHub 新建一个仓库。
2. 将本目录所有网站文件推送到仓库的 `main` 分支。
3. GitHub Actions 会使用 [`.github/workflows/pages.yml`](./.github/workflows/pages.yml) 自动部署。
4. 在仓库 Settings -> Pages 中确认 Source 使用 GitHub Actions。

公开地址通常是：

```text
https://你的用户名.github.io/仓库名/
https://你的用户名.github.io/仓库名/admin.html
```

## 3. 安全边界

- `supabase-config.js` 只能放 Project URL 和 publishable/anon key。
- 任何 service-role key 都不能放进 HTML、JavaScript 或 GitHub 仓库。
- 管理员权限由 `admin_users` 表和 RLS 控制。
- 测评码核销由 `redeem_access_code()` 原子更新，跨设备共享次数。
- 当前结果页和试跑进度仍保存在浏览器；后续如需跨设备保存结果，再增加用户登录或匿名结果表。
