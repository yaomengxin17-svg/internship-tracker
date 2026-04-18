-- 在 Supabase SQL Editor 中运行这段代码

create table internship_records (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  company text not null,
  intern_type text default '日常实习',
  position_type text default '游戏策划大类',
  custom_position text,
  submit_date date,
  has_exam text default '无',
  exam_date date,
  exam_status text default '待定',
  interview1_date date,
  interview1_status text default '待定',
  interview2_date date,
  interview2_status text default '待定',
  interview3_date date,
  interview3_status text default '待定',
  created_at timestamp with time zone default now()
);

-- 开启行级安全（每个用户只能看到自己的数据）
alter table internship_records enable row level security;

create policy "用户只能访问自己的记录"
  on internship_records
  for all
  using (auth.uid() = user_id);
