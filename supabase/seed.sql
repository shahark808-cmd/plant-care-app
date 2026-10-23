-- נתוני דמה לפיתוח מקומי / פרויקט בדיקות בלבד. מריצים אחרי שנרשמתם ויצרתם משק בית.
-- מוסיף 30 יום של הוצאות והכנסה לכל החברים, פרטיות ומשותפות לסירוגין.
do $$
declare
  hid uuid;
  uid uuid;
  cat uuid;
  i int;
begin
  for hid, uid in select household_id, user_id from public.household_members loop
    select id into cat from public.categories where household_id = hid and kind = 'income' order by sort_order limit 1;
    insert into public.transactions (household_id, owner_id, paid_by, amount, type, category_id, date, visibility, note)
    values (hid, uid, uid, 1200000, 'income', cat, date_trunc('month', current_date)::date + 9, 'private', 'משכורת (דמה)');

    for i in 1..30 loop
      select id into cat from public.categories where household_id = hid and kind = 'expense' order by random() limit 1;
      insert into public.transactions (household_id, owner_id, paid_by, amount, type, category_id, date, visibility, note)
      values (hid, uid, uid, (2000 + (random() * 40000))::int, 'expense', cat, current_date - (random() * 28)::int,
              case when i % 3 = 0 then 'shared' else 'private' end, 'דמה');
    end loop;
  end loop;
end $$;
