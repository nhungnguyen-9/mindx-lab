import type { Category } from '@shared/types';

export interface CategoryMeta {
  slug: Category;
  displayName: string;
  heroImage: string;
  description: string;
}

export const CATEGORIES: CategoryMeta[] = [
  {
    slug: 'scratch',
    displayName: 'Scratch',
    heroImage:
      'https://www.newcanaanlibrary.org/sites/default/files/styles/large/public/2023-01/scratch-coding.jpg',
    description: 'Những sản phẩm đầu tay đầy sáng tạo của học viên nhỏ tuổi, từ game đơn giản đến hoạt cảnh kể chuyện, giúp rèn luyện tư duy logic và khả năng sáng tạo.'
  },
  {
    slug: 'game',
    displayName: 'Game Maker',
    heroImage:
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR6hODCgOvRAMGOxIawl_y-2UHoA26egc8BNQ&s',
    description: 'Bộ sưu tập game do học viên tự xây dựng, từ gameplay, cơ chế đến thiết kế level, thể hiện khả năng tư duy hệ thống và sáng tạo trong phát triển game.'
  },
  {
    slug: 'app-python',
    displayName: 'App Python',
    heroImage:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Python-logo-notext.svg/1280px-Python-logo-notext.svg.png',
    description: 'Các ứng dụng Python phục vụ học tập và giải quyết bài toán thực tế, từ công cụ nhỏ đến dự án có logic xử lý dữ liệu và tự động hóa.'
  },
  {
    slug: 'web',
    displayName: 'Web',
    heroImage:
      'https://t3.ftcdn.net/jpg/03/21/24/30/360_F_321243084_GstfWflk1eTLlzUdRZ5mjoP5IG1iCc8J.jpg',
    description: 'Những website hoàn chỉnh từ frontend đến backend, tập trung vào UI/UX, hiệu năng và trải nghiệm người dùng hiện đại.'
  },
  {
    slug: 'computer-science',
    displayName: 'Computer Science',
    heroImage:
      'https://static.vecteezy.com/system/resources/previews/022/635/381/non_2x/artificial-intelligence-symbol-illustration-glowing-blue-chipset-for-artificial-intelligence-illustration-chip-icon-for-graphic-resource-of-technology-futuristic-computer-cyber-and-science-free-vector.jpg',
    description: 'Các dự án chuyên sâu về thuật toán, AI và xử lý dữ liệu, thể hiện tư duy giải quyết vấn đề và nền tảng khoa học máy tính vững chắc.'
  }
];

export function getCategoryBySlug(slug?: string): CategoryMeta | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}
