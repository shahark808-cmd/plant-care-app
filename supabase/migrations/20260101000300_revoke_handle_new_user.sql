-- פונקציית טריגר בלבד; אין סיבה שמשתמשים יוכלו לקרוא לה דרך RPC.
revoke execute on function public.handle_new_user() from authenticated, anon, public;
