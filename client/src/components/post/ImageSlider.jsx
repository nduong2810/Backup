import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

// ====================================================================
// ImageSlider — Swiper slider cho hình ảnh đính kèm bài viết
// BẮT BUỘC theo đề bài: tích hợp thư viện swiper
// ====================================================================

export default function ImageSlider({ images }) {
  // Không render nếu không có ảnh
  if (!images || images.length === 0) return null;

  return (
    <div className="mb-6 rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm">
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
            <div className="relative w-full h-64 sm:h-80 md:h-96 bg-slate-100">
              <img
                src={image}
                alt={`Hình ảnh bài viết ${index + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Chú thích số ảnh */}
      {images.length > 1 && (
        <div className="px-4 py-2 text-xs text-slate-500 bg-slate-50 text-center border-t border-slate-100">
          {images.length} hình ảnh đính kèm — vuốt hoặc bấm mũi tên để xem
        </div>
      )}
    </div>
  );
}
