create database Bus_no_road;
go
use Bus_no_road;
go

create table Route(
	id varchar(20) primary key,  -- Id cho mỗi tuyến (cả chuyến đi và về)
	number varchar(20), -- số tuyến: 01, 02, 03A, 03B, ...
	unit nvarchar(255), -- thuộc công ty nào 
	name nvarchar(255), -- ví dụ: bến xe Gia Lâm - bến xe Yên Nghĩa
	ticket_price varchar(20), -- giá vé 
	distance varchar(20), -- độ dài tuyến 
	direction varchar(20), -- forward hoặc backward (đánh dấu chuyến đi hay chuyến về của cùng số tuyến: 01, 02, ...)
	start_point nvarchar(255), -- điểm bắt đầu của tuyến xe buýt
    end_point nvarchar(255), -- điểm kết thúc của tuyến xe buýt
    operation_time nvarchar(50), -- thời gian hoạt động của tuyến xe buýt
    frequency nvarchar(50) -- tần suất chạy xe của tuyến
);

-- alter table Route add avg_rating float default 0;

create table Bus(
	license_plate varchar(20) primary key, --biển số xe
	route_id_forward varchar(20), --id tuyến chuyến đi
	route_id_backward varchar(20), -- id tuyến chuyến về (cần cùng số tuyến với chuyến đi)
	longitude float, --kinh độ
	latitude float, --vĩ độ
	direction float, --hướng xe đang đi
	speed float, -- tốc độ
	update_at datetime DEFAULT CURRENT_TIMESTAMP,
	constraint fk_bus_route_forward foreign key (route_id_forward) references Route(id),
	constraint fk_bus_route_backward foreign key (route_id_backward) references Route(id)
);

create table User_account(
	id varchar(20) primary key, --id tài khoản
	name nvarchar(255), --tên người dùng
	mail varchar(255), -- email
	username varchar(50), --tên tài khoản
	password varchar(255), --mật khẩu
	role varchar(20) default 'client' -- client hoặc admin
);

-- create table Review(
-- 	user_id varchar(20), --id người dùng
-- 	route_id varchar(20), --id tuyến đánh giá (lấy id của chuyến đi)
-- 	rating float,
-- 	comment text,
-- 	primary key (user_id, route_id),
-- 	constraint fk_review_user foreign key (user_id) references User_account(id),
-- 	constraint fk_review_route foreign key (route_id) references Route(id)
-- );

create table Monthly_ticket(
	id varchar(50) primary key,
    user_id varchar(20), 
    start_date date,
    end_date date,
    qr_code nvarchar(max),
    price int,
    status varchar(20),
    constraint fk_ticket_user foreign key (user_id) references User_account(id)
);

create table Node(
	id varchar(20) primary key, -- id điểm nối
	latitude float, --vĩ độ 
	longitude float, -- kinh độ
	unique (latitude, longitude),
	address nvarchar(225) null, -- nếu điểm nối là bến xe thì có địa chỉ
	is_bus_stop int check (is_bus_stop in (0, 1)) --điểm nối có phải là bến xe không 
);

create table Route_node(
	route_id varchar(20), -- id tuyến (vì chuyến đi và về đi 2 đường khác nhau)
	node_id varchar(20), -- id điểm nối 
	order_in_route int, -- thứ tự của bến xe trong tuyến đấy để tạo đường đi liên tục cho xe buýt
	primary key(route_id, node_id),
	constraint fk_routebs_bs foreign key (node_id) references Node(id),
	constraint fk_routebs_route foreign key (route_id) references route(id)
);
