import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

// ====================================================================
// ImageSlider — Swiper slider cho hình ảnh đính kèm bài viết
// BẮT BUỘC theo đề bài: tích hợp thư viện swiper
// Đã tích hợp design tokens từ hệ thống thiết kế chính
// ====================================================================

export default function ImageSlider({ images }) {
  // Không render nếu không có ảnh
  if (!images || images.length === 0) return null;

  return (
    <div className="mb-6 rounded-xl overflow-hidden border border-outline-variant bg-surface-container-lowest shadow-sm">
      <Swiper
        modules={[Navigation, Pagination]}
        navigation
        pagination={{ clickable: true }}
        loop={images.length > 1}
        spaceBetween={0}
        slidesPerView={1}
        className="post-image-slider"
      >
        {images.map((image, index) => (
          <SwiperSlide key={index}>
            <div className="relative w-full h-64 sm:h-80 md:h-96 bg-surface-container-low">
              <a
                href={image}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full h-full cursor-zoom-in"
                title="Click để mở ảnh kích thước đầy đủ"
              >
                <img
                  src={image}
                  alt={`Hình ảnh bài viết ${index + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </a>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Chú thích số ảnh */}
      {images.length > 1 && (
        <div className="px-4 py-2 font-body-sm text-body-sm text-secondary bg-surface-container-low text-center border-t border-outline-variant">
          {images.length} hình ảnh đính kèm — vuốt hoặc bấm mũi tên để xem
        </div>
      )}
    </div>
  );
}
