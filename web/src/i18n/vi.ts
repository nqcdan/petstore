export const vi = {
  common: {
    save: 'Lưu', cancel: 'Hủy', delete: 'Xóa', edit: 'Sửa', create: 'Thêm mới', search: 'Tìm kiếm...', view: 'Xem chi tiết',
    back: 'Quay lại', loading: 'Đang tải...', error: 'Đã có lỗi xảy ra', retry: 'Thử lại', previous: 'Trước', next: 'Sau',
    empty: 'Không có dữ liệu', currency: 'VNĐ', all: 'Tất cả', actions: 'Thao tác', saved: 'Đã lưu', page: 'Trang {{page}} / {{total}}',
  },
  nav: {
    home: 'Trang chủ', products: 'Vật phẩm', foods: 'Thức ăn', about: 'Về chúng tôi', blog: 'Blog', contact: 'Liên hệ',
    cart: 'Giỏ hàng', history: 'Lịch sử đơn hàng', profile: 'Thông tin cá nhân', admin: 'Quản trị', login: 'Đăng nhập', logout: 'Đăng xuất',
    theme: 'Giao diện', light: 'Sáng', dark: 'Tối', system: 'Theo hệ thống', language: 'Ngôn ngữ', menu: 'Menu',
  },
  auth: {
    demoTitle: 'Tài khoản demo', copy: 'Sao chép',
    required: 'Vui lòng đăng nhập để tiếp tục', forbidden: 'Bạn không có quyền truy cập trang này',
    loginCustomer: 'Đăng nhập khách hàng (demo)', loginAdmin: 'Đăng nhập quản trị (demo)',
  },
  home: {
    slides: [
      { tag: 'VẬT DỤNG', title: 'Vật dụng dành cho thú cưng', text: 'Các loại vật dụng chất lượng cao, bảo hành 1 năm.', cta: 'Mua ngay' },
      { tag: 'THỨC ĂN', title: 'Đồ ăn cho thú cưng', text: 'Các loại hạt, pate, vitamin cho thú cưng.', cta: 'Mua ngay' },
    ],
    featured: 'Sản phẩm nổi bật', featuredSub: 'Được khách hàng chọn nhiều nhất',
    banners: { products: 'Vật dụng', foods: 'Đồ ăn', spa: 'Dịch vụ tắm rửa thú cưng', shop: 'Mua ngay', spaCta: 'Trải nghiệm ngay' },
    blog: 'Blog của chúng tôi', readMore: 'Đọc thêm', gallery: '#PETS_Coffee_And_Services',
  },
  shop: {
    titleProducts: 'Vật phẩm thú cưng', titleFoods: 'Thức ăn cho vật nuôi', showing: 'Hiển thị {{count}} trên {{total}} kết quả',
    sortBy: 'Sắp xếp theo giá', priceAsc: 'Tăng dần', priceDesc: 'Giảm dần', defaultSort: 'Mặc định', add: 'Thêm vào giỏ hàng', added: 'Đã thêm "{{name}}" vào giỏ hàng',
    details: 'Chi tiết sản phẩm', none: 'Không tìm thấy sản phẩm nào',
  },
  cart: {
    title: 'Giỏ hàng', empty: 'Giỏ hàng của bạn đang trống', continue: 'Tiếp tục mua sắm', product: 'Sản phẩm', price: 'Giá', quantity: 'Số lượng',
    total: 'Thành tiền', remove: 'Xóa khỏi giỏ', clear: 'Xóa giỏ hàng', summary: 'Tổng đơn hàng', checkout: 'Thanh toán',
  },
  checkout: {
    title: 'Thanh toán', greeting: 'Chào bạn {{name}}', info: 'Thông tin cá nhân', fullName: 'Họ và tên', address: 'Địa chỉ', phone: 'Số điện thoại', email: 'Email',
    note: 'Ghi chú cho đơn hàng', notePlaceholder: 'Ghi chú', yourOrder: 'Đơn hàng của bạn', total: 'Tổng cộng', method: 'Hình thức thanh toán',
    cod: 'Thanh toán khi nhận hàng (COD)', atm: 'Chuyển khoản ATM', place: 'Đặt hàng', chooseMethod: 'Vui lòng chọn phương thức thanh toán',
    success: 'Đặt hàng thành công', empty: 'Chưa có sản phẩm nào để thanh toán', updateProfile: 'Cập nhật thông tin cá nhân',
  },
  history: {
    title: 'Lịch sử giao dịch', code: 'Mã đơn hàng', name: 'Tên đơn hàng', date: 'Ngày đặt', total: 'Tổng tiền', state: 'Tình trạng', empty: 'Bạn chưa có đơn hàng nào',
    detail: 'Chi tiết đơn hàng', item: 'Sản phẩm', quantity: 'Số lượng', payment: 'Thanh toán', note: 'Ghi chú',
  },
  state: { DUE: 'Đang giao / chờ thanh toán', PAID: 'Thành công', CANCEL: 'Đã hủy' },
  profile: {
    title: 'Thông tin chi tiết', avatar: 'Ảnh đại diện', fullName: 'Họ và tên', email: 'Email', birthday: 'Ngày sinh', phone: 'Điện thoại', address: 'Địa chỉ',
    changePassword: 'Đổi mật khẩu (Keycloak)', phoneInvalid: 'Số điện thoại gồm 10 chữ số, bắt đầu bằng 0', required: 'Bắt buộc', upload: 'Chọn ảnh',
  },
  contact: {
    title: 'Liên hệ', sub: 'Mọi thắc mắc vui lòng liên hệ với chúng tôi.', branch: 'Chi nhánh 1', address: 'Tòa nhà Landmark 81', hotline: 'Hotline',
    send: 'Gửi tin nhắn', name: 'Họ tên', email: 'Email', message: 'Nội dung', sent: 'Ý kiến của bạn đã được lưu', emailInvalid: 'Email không hợp lệ', required: 'Bắt buộc',
  },
  about: {
    title: 'Về chúng tôi',
    body: 'Cửa hàng PETS chuyên hoạt động trong lĩnh vực chăm sóc và làm đẹp cho thú cưng. Chúng tôi tự hào với đội ngũ nhân viên kinh nghiệm, được đào tạo bài bản, chuyên nghiệp từ các chuyên gia hàng đầu về lĩnh vực chăm sóc thú cưng tại các nước phát triển trên thế giới. Cửa hàng cung cấp tất cả sản phẩm các loại thức ăn, đồ dùng, thực phẩm chức năng, thuốc… cần thiết cho những chú chó, chú mèo của bạn.',
    stats: { customers: 'Khách hàng', items: 'Mặt hàng', partners: 'Đối tác', satisfaction: 'Hài lòng' },
    team: 'Đội ngũ nhân viên của PETS', member: 'Thành viên', leader: 'Nhóm trưởng', partners: 'Các đối tác chính',
  },
  blog: { title: 'Blog của chúng tôi', detail: 'Chi tiết blog', share: 'Chia sẻ', notFound: 'Không tìm thấy bài viết' },
  footer: { tagline: 'Chăm sóc và làm đẹp cho thú cưng.', links: 'Liên kết', follow: 'Theo dõi chúng tôi', rights: 'Bản quyền thuộc PETS Store.' },
  notFound: { title: 'Không tìm thấy trang', text: 'Trang bạn tìm không tồn tại.' },
  admin: {
    title: 'Quản trị', dashboard: 'Tổng quan', products: 'Vật phẩm', foods: 'Thức ăn', orders: 'Đơn hàng', customers: 'Khách hàng', employees: 'Nhân viên', backToShop: 'Về cửa hàng',
    kpi: { revenue: 'Doanh thu', orders: 'Đơn hàng', customers: 'Khách hàng', items: 'Sản phẩm' },
    revenue30: 'Doanh thu 30 ngày', ordersByState: 'Đơn theo trạng thái', topItems: 'Sản phẩm bán chạy', sold: 'Đã bán',
    name: 'Tên', type: 'Loại', price: 'Giá', description: 'Mô tả', image: 'Ảnh', uploadImage: 'Tải ảnh lên', createItem: 'Thêm sản phẩm', editItem: 'Sửa sản phẩm',
    confirmDelete: 'Xóa "{{name}}"?', confirmDeleteText: 'Hành động này không thể hoàn tác.', deleted: 'Đã xóa', priceInvalid: 'Giá phải là số nguyên >= 0',
    filterState: 'Lọc trạng thái', changeState: 'Đổi trạng thái', stateChanged: 'Đã cập nhật trạng thái', customer: 'Khách hàng', orderCount: 'Số đơn', username: 'Tài khoản',
    role: 'Vai trò', phone: 'Điện thoại', email: 'Email', fullName: 'Họ và tên', date: 'Ngày', code: 'Mã', total: 'Tổng', state: 'Trạng thái',
  },
}

export type Resources = typeof vi
