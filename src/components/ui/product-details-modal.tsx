import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { GetProductDto, GetProductMediaDto } from '@/services/api';
import { usePersianNumbers } from '@/hooks/usePersianNumbers';
import { getMediaUrl } from '@/lib/utils';

interface ProductDetailsModalProps {
  product: GetProductDto | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ProductDetailsModal = ({ product, isOpen, onClose }: ProductDetailsModalProps) => {
  const { formatNumber: toPersian } = usePersianNumbers();

  if (!product) return null;

  const mainImage = product.media?.find(m => m.isMain);
  const imageUrl = getMediaUrl(mainImage?.mediaUrl, mainImage?.title);

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title className="text-2xl font-bold text-gray-900">
                    اطلاعات محصول
                  </Dialog.Title>
                  <button
                    type="button"
                    className="text-gray-500 hover:text-gray-700"
                    onClick={onClose}
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                {/* Content */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6" dir="rtl">
                  {/* Image Section */}
                  <div className="space-y-4">
                    <div className="aspect-[3/4] relative rounded-lg overflow-hidden border border-gray-200">
                      <img
                        src={imageUrl}
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {product.media?.map((media: GetProductMediaDto, index: number) => (
                        <div key={index} className="aspect-square relative rounded-md overflow-hidden border border-gray-200">
                          <img
                            src={getMediaUrl(media.mediaUrl, media.title)}
                            alt={`تصویر ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          {media.isMain && (
                            <div className="absolute top-1 right-1 bg-green-500 text-white text-[10px] px-1 rounded">
                              اصلی
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Details Section */}
                  <div className="space-y-6">
                    {/* Basic Info */}
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">{product.title}</h3>
                      {product.subtitle && (
                        <p className="text-gray-600">{product.subtitle}</p>
                      )}
                    </div>

                    {/* Authors */}
                    {product.authors && product.authors.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">نویسندگان:</h4>
                        <div className="space-y-1">
                          {product.authors.map((author, idx) => (
                            <div key={idx} className="flex items-center text-gray-700">
                              <span>{author.authorName}</span>
                              {author.role && (
                                <span className="text-gray-500 text-sm mr-2">({author.role})</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Book Details */}
                    <div className="grid grid-cols-2 gap-4">
                      {product.isbn && (
                        <div>
                          <h4 className="font-medium text-gray-900">شابک:</h4>
                          <p className="text-gray-700">{product.isbn}</p>
                        </div>
                      )}
                      {product.language && (
                        <div>
                          <h4 className="font-medium text-gray-900">زبان:</h4>
                          <p className="text-gray-700">{product.language}</p>
                        </div>
                      )}
                      {product.pages && (
                        <div>
                          <h4 className="font-medium text-gray-900">تعداد صفحات:</h4>
                          <p className="text-gray-700">{toPersian(product.pages.toString())}</p>
                        </div>
                      )}
                      {product.publicationDate && (
                        <div>
                          <h4 className="font-medium text-gray-900">تاریخ انتشار:</h4>
                          <p className="text-gray-700">{new Date(product.publicationDate).toLocaleDateString('fa-IR')}</p>
                        </div>
                      )}
                      {product.edition && (
                        <div>
                          <h4 className="font-medium text-gray-900">ویرایش:</h4>
                          <p className="text-gray-700">{product.edition}</p>
                        </div>
                      )}
                      {product.series && (
                        <div>
                          <h4 className="font-medium text-gray-900">مجموعه:</h4>
                          <p className="text-gray-700">{product.series}</p>
                        </div>
                      )}
                      {product.volume && (
                        <div>
                          <h4 className="font-medium text-gray-900">جلد:</h4>
                          <p className="text-gray-700">{toPersian(product.volume.toString())}</p>
                        </div>
                      )}
                      {product.dimensions && (
                        <div>
                          <h4 className="font-medium text-gray-900">ابعاد:</h4>
                          <p className="text-gray-700">{product.dimensions}</p>
                        </div>
                      )}
                      {product.weight && (
                        <div>
                          <h4 className="font-medium text-gray-900">وزن:</h4>
                          <p className="text-gray-700">{toPersian(product.weight.toString())} گرم</p>
                        </div>
                      )}
                      {product.ageGroup && (
                        <div>
                          <h4 className="font-medium text-gray-900">گروه سنی:</h4>
                          <p className="text-gray-700">{product.ageGroup}</p>
                        </div>
                      )}
                    </div>

                    {/* Formats & Pricing */}
                    {product.formats && product.formats.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">قیمت و فرمت‌ها:</h4>
                        <div className="space-y-2">
                          {product.formats.map((format, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                              <div className="flex items-center">
                                <span className="text-xl">
                                  {format.formatType === 'Physical' ? '📚' : format.formatType === 'Ebook' ? '📱' : '🎧'}
                                </span>
                                <span className="mr-2">{format.formatType}</span>
                              </div>
                              <div className="text-left">
                                <p className="text-gray-900 font-medium">
                                  {toPersian(format.price.toLocaleString())} تومان
                                </p>
                                {format.discountedPrice && (
                                  <p className="text-red-600 text-sm">
                                    {toPersian(format.discountedPrice.toLocaleString())} تومان
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Description */}
                    {product.description && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">توضیحات:</h4>
                        <p className="text-gray-700 whitespace-pre-line">{product.description}</p>
                      </div>
                    )}

                    {/* Tags */}
                    {product.tags && product.tags.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">برچسب‌ها:</h4>
                        <div className="flex flex-wrap gap-2">
                          {product.tags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800"
                            >
                              {tag.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};