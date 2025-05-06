PS C:\Users\Lenovo\Desktop\TDTU\.Hoc Ky 6\SOA\soa-project\frontend-user> npx shadcn-ui@latest init
The 'shadcn-ui' package is deprecated. Please use the 'shadcn' package instead:

  npx shadcn@latest init

For more information, visit: https://ui.shadcn.com/docs/cli

for fastAPI backend:
The method "execute" in class "AsyncSession" is deprecated
  🚨 You probably want to use `session.exec()` instead of `session.execute()`.

This is the original SQLAlchemy `session.execute()` method that returns objects
of type `Row`, and that you have to call `scalars()` to get the model objects.

For example:

```Python
heroes = await session.execute(select(Hero)).scalars().all()
```