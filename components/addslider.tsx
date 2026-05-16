'use client';

import Slider from 'react-slick';
import Image from 'next/image';

const AdvertisementSlider = () => {
  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    autoplay: true,
    autoplaySpeed: 2500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false,
  };

  const images = [
    '/Ad1.png',
    '/Ad2.png',
    '/Ad3.png',
  ];

  return (
    <div className="bg-gray-300 py-16 px-4" data-aos="fade-up">
      <h2 className="text-xl font-bold text-center mb-6">ADVERTISEMENT</h2>
      <Slider {...settings}>
        {images.map((src, index) => (
          <div key={index} className="w-full h-[300px] relative">
            <Image
              src={src}
              alt={`Ad ${index + 1}`}
              layout="fill"
              objectFit="cover"
              className="rounded-lg"
            />
          </div>
        ))}
      </Slider>
    </div>
  );
};

export default AdvertisementSlider;
