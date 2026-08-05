-- ============================================================
--  รอบวันที่ 4 ส.ค. — ทีม LIVE บทพูดฟอร์แมตใหม่
--  ฟอร์แมต: ชื่อเล่น + ชื่อธุรกิจ + ประโยคแนะนำตัว
--  7 วินาที · ไม่มีคำว่า "คุณ" · ไม่มี "ค่ะ/ครับ" · ไม่มีซับไตเติล
--  วางไฟล์นี้ใน Neon SQL Editor ได้เลย
-- ============================================================

begin;

-- 1) อัปเดตบทพูดในตาราง members --------------------------------
update members set dialogue_th = 'กอล์ฟ อะเดย์เฟรช ผลไม้พรีเมียม และ น้ำผลไม้คั้นสด สำหรับ กระเช้าของขวัญ และ ลูกค้าองค์กร', updated_at = now() where id = 'live-aday-fresh';
update members set dialogue_th = 'เบียร์ กุ้งดำรงค์ กุ้งสดคุณภาพ ค้าส่ง ค้าปลีก จัดส่งทั่วประเทศ ภายใน ยี่สิบสี่ ชั่วโมง', updated_at = now() where id = 'live-damrong';
update members set dialogue_th = 'จ๊าก หยกสด ขนมไทยใบเตยแท้ ร้อยเปอร์เซ็นต์ หอมอร่อย แบบต้นตำรับ', updated_at = now() where id = 'live-yoksod';
update members set dialogue_th = 'เจิน ตราศิริชัย นมแพะ ยูเอชที และ นมโปรตีนสูง คุณภาพ สำหรับ ทุกวัย', updated_at = now() where id = 'live-sirichai';
update members set dialogue_th = 'เบญ น้ำผึ้งเวชพงศ์ น้ำผึ้งธรรมชาติแท้ ร้อยเปอร์เซ็นต์ คุณภาพ ส่งตรง จากรัง', updated_at = now() where id = 'live-vejpong';

-- อัปเดตฉากของเวชพงศ์ (เปลี่ยนใหม่ตามที่เจ้าของขอ)
update members set scene_idea =
  'คุกเข่าข้างรังผึ้งโดยไม่ใส่ชุดป้องกันเลย แบมือรับ ผึ้งตัวใหญ่กว่าปกติบินลงมาเกาะฝ่ามืออย่างไว้ใจ เธอลูบหลังผึ้งด้วยปลายนิ้วเหมือนลูบสัตว์เลี้ยงที่รัก แล้วทั้งรังบินขึ้นมาวนรอบตัวเป็นเกลียวสีทองเหมือนขอบคุณ จากนั้นน้ำผึ้งสีทองไหลเป็นสายลงขวดสินค้าจริงในมือจนเต็ม',
  updated_at = now() where id = 'live-vejpong';

-- 2) คลิปเวอร์ชันใหม่ -------------------------------------------
insert into clips (member_id, version, job_id, video_url, scene_th, dialogue_th, status) values

('live-aday-fresh', 2, 'fe75be11-01ff-45e5-ac3a-35a592e64115',
 'https://d8j0ntlcm91z4.cloudfront.net/user_3FvAUpXpCnZUma0p4ZCgNFe1CGD/hf_20260804_143905_fe75be11-01ff-45e5-ac3a-35a592e64115.mp4',
 'วิ่งสปีดเข้าสวนผลไม้ เด็ดผลไม้เป็นภาพเบลอลงกระเช้า วิ่งไปส่งถึงหน้าบ้านลูกค้า ยื่นให้พร้อมรอยยิ้ม',
 'กอล์ฟ อะเดย์เฟรช ผลไม้พรีเมียม และ น้ำผลไม้คั้นสด สำหรับ กระเช้าของขวัญ และ ลูกค้าองค์กร', 'approved'),

('live-damrong', 2, 'f3e5a8e0-7e38-4e46-86c1-390948929dbd',
 'https://d8j0ntlcm91z4.cloudfront.net/user_3FvAUpXpCnZUma0p4ZCgNFe1CGD/hf_20260804_145459_f3e5a8e0-7e38-4e46-86c1-390948929dbd.mp4',
 'วิ่งพุ่งดำลงบ่อกุ้ง จับกุ้งใต้น้ำด้วยมือเปล่า ขึ้นมาวางลงถาดแช่เย็นแล้วยกโชว์',
 'เบียร์ กุ้งดำรงค์ กุ้งสดคุณภาพ ค้าส่ง ค้าปลีก จัดส่งทั่วประเทศ ภายใน ยี่สิบสี่ ชั่วโมง', 'draft'),

('live-yoksod', 2, 'd29a9556-ffd9-4eea-8707-46ec446d71c6',
 'https://d8j0ntlcm91z4.cloudfront.net/user_3FvAUpXpCnZUma0p4ZCgNFe1CGD/hf_20260804_145233_d29a9556-ffd9-4eea-8707-46ec446d71c6.mp4',
 'ลูบใบเตยในไร่ แสงเขียวหยกพวยพุ่งมารวมในมือ ก่อตัวเป็นเม็ดขนมใบเตยลงถ้วยเบญจรงค์ ราดกะทิ',
 'จ๊าก หยกสด ขนมไทยใบเตยแท้ ร้อยเปอร์เซ็นต์ หอมอร่อย แบบต้นตำรับ', 'draft'),

('live-sirichai', 2, '62f3b7de-fef1-4206-812a-5705e75761fb',
 'https://d8j0ntlcm91z4.cloudfront.net/user_3FvAUpXpCnZUma0p4ZCgNFe1CGD/hf_20260804_145233_62f3b7de-fef1-4206-812a-5705e75761fb.mp4',
 'แพะเดินมาซบข้าง เธอลูบหัว น้ำนมพุ่งเป็นเส้นโค้งลงกล่อง UHT เม็ดมะม่วงหมุนเป็นเกลียวทองอยู่ด้านหลัง',
 'เจิน ตราศิริชัย นมแพะ ยูเอชที และ นมโปรตีนสูง คุณภาพ สำหรับ ทุกวัย', 'draft'),

('live-vejpong', 2, 'b870fcfb-0ec0-4123-b2d0-b1eb2ea29e9f',
 'https://d8j0ntlcm91z4.cloudfront.net/user_3FvAUpXpCnZUma0p4ZCgNFe1CGD/hf_20260804_145355_b870fcfb-0ec0-4123-b2d0-b1eb2ea29e9f.mp4',
 'ผึ้งตัวใหญ่บินมาเกาะฝ่ามือ เธอลูบหลังผึ้งด้วยความรัก ทั้งรังบินวนรอบตัว แล้วน้ำผึ้งไหลลงขวดสินค้าจริง (ใช้รูปขวดจริงเป็น reference)',
 'เบญ น้ำผึ้งเวชพงศ์ น้ำผึ้งธรรมชาติแท้ ร้อยเปอร์เซ็นต์ คุณภาพ ส่งตรง จากรัง', 'draft');

-- 3) คลิปเก่าที่ใช้บทแบบเดิม ให้ถือว่าตกไปแล้ว -------------------
update clips set status = 'rejected'
where member_id in ('live-aday-fresh','live-damrong','live-yoksod','live-sirichai','live-vejpong')
  and version = 1;

-- 4) อัปเดตสถานะ members ตามคลิปล่าสุด --------------------------
update members m set status = 'approved'
where exists (select 1 from clips c where c.member_id = m.id and c.status = 'approved');
update members m set status = 'drafted'
where m.status <> 'approved' and exists (select 1 from clips c where c.member_id = m.id);

commit;

-- ============================================================
--  เพิ่มเติม: ธีร์ ปตท.ปากช่องไฮเวย์ (ครบทีม LIVE 6/6)
--  ใช้รูปปั๊ม PTT จริงเป็น reference ให้ป้ายและโลโก้ตรงของจริง
-- ============================================================
begin;

update members set
  dialogue_th = 'ธีร์ ปากช่องไฮเวย์ ปั๊ม ปตท. คาเฟ่อเมซอน แดรี่ควีน และ โรงแรมชิลล์ เขาใหญ่ ครบ ในที่เดียว',
  scene_idea  = 'ในปั๊ม ปตท. ปากช่องไฮเวย์จริงตอนกลางคืน คนขับรถบรรทุกนั่งหลับตาเหนื่อยล้าอยู่ที่โต๊ะพัก เขาเดินมาวางกาแฟร้อนให้พร้อมตบไหล่เบาๆ คนขับจิบแล้วถอนหายใจยาว สีหน้าคลายลง ยืดแขนบิดขี้เกียจ ลุกขึ้นยิ้มชูนิ้วโป้ง แล้วเดินกลับขึ้นรถออกไปบนไฮเวย์ — โทน เหนื่อยก็พัก แล้วค่อยไปต่อ',
  updated_at  = now()
where id = 'live-pchw';

insert into clips (member_id, version, job_id, video_url, scene_th, dialogue_th, status) values
('live-pchw', 2, '987de726-fd66-475d-ba9f-4e005d8364ad',
 'https://d8j0ntlcm91z4.cloudfront.net/user_3FvAUpXpCnZUma0p4ZCgNFe1CGD/hf_20260804_150042_987de726-fd66-475d-ba9f-4e005d8364ad.mp4',
 'ปั๊ม ปตท. จริงตอนกลางคืน — คนขับรถบรรทุกเหนื่อย ได้กาแฟ พักจนหายเพลีย แล้วขับต่อ',
 'ธีร์ ปากช่องไฮเวย์ ปั๊ม ปตท. คาเฟ่อเมซอน แดรี่ควีน และ โรงแรมชิลล์ เขาใหญ่ ครบ ในที่เดียว', 'draft');

update clips set status = 'rejected' where member_id = 'live-pchw' and version = 1;

update members m set status = 'drafted'
where m.status <> 'approved' and exists (select 1 from clips c where c.member_id = m.id);

commit;
