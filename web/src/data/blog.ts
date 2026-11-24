// Static sample content carried over from the JSP (blog.jsp / blog-detail.jsp); there is no blog API.
export interface BlogPost {
  slug: string
  title: string
  date: string
  image: string
  paragraphs: string[]
  tags: string[]
  author: string
}

export const posts: BlogPost[] = [
  {
    slug: 'kush',
    title: 'Kush',
    date: '2021-02-16',
    image: '/img/blog/kush.jpg',
    author: 'Thanh Phương',
    tags: ['Kush', 'Corgi'],
    paragraphs: [
      'Kush thuộc giống chó Corgi, tên đầy đủ là Pembroke Welsh Corgi. Theo tiếng Wales, tên này nghĩa là "chú chó lùn", đúng như hình dáng bên ngoài của Corgi và gắn liền với vùng Pembrokeshire, xứ Wales, nơi tìm thấy chúng.',
      'Theo nhiều tài liệu lưu trữ, giống chó Corgi đã có niên đại lên đến 3000 năm. Chú Corgi đầu tiên được ghi nhận tại xứ Wales và có khả năng cao là phát triển từ giống chó Vallhunds của Thụy Điển trong thời kỳ tiền Viking.',
      'Corgi vốn được dùng để chăn gia súc dù dáng vẻ nhỏ nhắn. Bốn chân ngắn lại là lợi thế vì chúng khó dính những cú đá hậu nguy hiểm của gia súc lớn. Khi có con nào đi lạc, Corgi sẽ nhanh chóng cắn vào chân để kéo chúng quay lại đàn.',
      'Về sau, hoạt động chăn nuôi ở châu Âu không còn phổ biến, nhưng nhờ sự thông minh và ngoại hình đáng yêu, nhiều gia đình đã nuôi Corgi như một người bạn trong nhà. Tại Việt Nam, Corgi chỉ được đưa về từ khoảng năm 2010 nhưng đã nhanh chóng gây nên một cơn sốt trong thế giới thú cưng.',
    ],
  },
  {
    slug: 'orange',
    title: 'Orange',
    date: '2021-02-14',
    image: '/img/blog/c.jpg',
    author: 'Thanh Phương',
    tags: ['Orange'],
    paragraphs: ['Orange là một chú thú cưng của cửa hàng PETS. Bài viết chi tiết sẽ được cập nhật sau.'],
  },
  {
    slug: 'mango',
    title: 'Mango',
    date: '2021-02-15',
    image: '/img/blog/e.jpg',
    author: 'Thanh Phương',
    tags: ['Mango'],
    paragraphs: ['Mango là một chú thú cưng của cửa hàng PETS. Bài viết chi tiết sẽ được cập nhật sau.'],
  },
]
