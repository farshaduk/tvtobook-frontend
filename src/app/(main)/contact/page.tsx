'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ChevronRightIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  ClockIcon,
  PaperAirplaneIcon,
  ChatBubbleLeftRightIcon,
  QuestionMarkCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { contactFeedbackApi } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const ContactPage: React.FC = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    category: 'general'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      setFormData(prev => ({
        ...prev,
        name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : prev.name,
        email: user.email || prev.email
      }));
    }
  }, [isAuthenticated, user]);

  const contactInfo = [
    {
      icon: <PhoneIcon className="h-6 w-6" />,
      title: "شماره تماس",
      value: "۰۲۱-۶۶۴۲۶۶۶۹",
      description: "پاسخگویی در ساعات اداری"
    },
    {
      icon: <EnvelopeIcon className="h-6 w-6" />,
      title: "ایمیل پشتیبانی",
      value: "support@tvtobook.cam",
      description: "پاسخ در کمتر از ۲۴ ساعت"
    },
    {
      icon: <ClockIcon className="h-6 w-6" />,
      title: "ساعات کاری",
      value: "۹ صبح تا ۶ عصر",
      description: "دوشنبه تا جمعه"
    }
  ];

  const categories = [
    { value: 'general', label: 'عمومی' },
    { value: 'technical', label: 'مشکل فنی' },
    { value: 'billing', label: 'صورت حساب' },
    { value: 'suggestion', label: 'پیشنهاد' },
    { value: 'complaint', label: 'شکایت' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast.error('برای ارسال پیام باید وارد حساب کاربری خود شوید');
      router.push('/login?redirect=/contact');
      return;
    }

    setIsSubmitting(true);

    try {
      await contactFeedbackApi.createFeedback({
        name: formData.name,
        email: formData.email,
        phoneNumber: user?.phoneNumber || '',
        subject: formData.subject,
        message: formData.message,
        category: formData.category
      });
      
      toast.success('پیام شما با موفقیت ارسال شد!');
      setFormData({
        name: user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : '',
        email: user?.email || '',
        subject: '',
        message: '',
        category: 'general'
      });
    } catch (error: any) {
      if (error.response?.status === 401) {
        toast.error('لطفاً وارد حساب کاربری خود شوید');
        router.push('/login?redirect=/contact');
      } else {
        toast.error(error.response?.data?.message || 'خطا در ارسال پیام. لطفاً دوباره تلاش کنید.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-green-600 to-blue-600 text-white">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              تماس با ما
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
              ما اینجا هستیم تا به شما کمک کنیم. سوالات، پیشنهادات و نظرات خود را با ما در میان بگذارید
            </p>
          </div>
        </div>
      </div>

      {/* Contact Info Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              اطلاعات تماس
            </h2>
            <p className="text-xl text-gray-600">
              راه‌های مختلف برای ارتباط با ما
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {contactInfo.map((info, index) => (
              <div key={index} className="text-center p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="text-green-600 mb-4 flex justify-center">
                  {info.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {info.title}
                </h3>
                <p className="text-gray-600 font-medium mb-1">
                  {info.value}
                </p>
                <p className="text-sm text-gray-500">
                  {info.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Contact Form Section */}
      <div className="py-20 bg-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                پیام خود را ارسال کنید
              </h2>
              <p className="text-gray-600">
                فرم زیر را پر کنید و ما در اسرع وقت با شما تماس خواهیم گرفت
              </p>
              {!isAuthenticated && !authLoading && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    برای ارسال پیام باید وارد حساب کاربری خود شوید. 
                    <Link href="/login?redirect=/contact" className="text-yellow-900 font-semibold hover:underline mr-1">
                      ورود
                    </Link>
                    یا
                    <Link href="/register?redirect=/contact" className="text-yellow-900 font-semibold hover:underline mr-1">
                      ثبت نام
                    </Link>
                  </p>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    نام و نام خانوادگی *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="نام خود را وارد کنید"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    ایمیل *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="ایمیل خود را وارد کنید"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                    دسته‌بندی
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    {categories.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                    موضوع *
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="موضوع پیام خود را وارد کنید"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  پیام *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="پیام خود را اینجا بنویسید..."
                />
              </div>

              <div className="text-center">
                <button
                  type="submit"
                  disabled={isSubmitting || !isAuthenticated || authLoading}
                  className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center mx-auto"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      در حال ارسال...
                    </>
                  ) : (
                    <>
                      <PaperAirplaneIcon className="w-5 h-5 mr-2" />
                      ارسال پیام
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              سوالات متداول
            </h2>
            <p className="text-xl text-gray-600">
              پاسخ سوالات رایج کاربران
            </p>
          </div>

          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                چگونه می‌توانم آگهی خود را منتشر کنم؟
              </h3>
              <p className="text-gray-600">
                ابتدا باید در سایت ثبت نام کنید، سپس روی دکمه "آگهی جدید" کلیک کرده و اطلاعات آگهی خود را وارد کنید.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                آیا استفاده از سایت رایگان است؟
              </h3>
              <p className="text-gray-600">
                بله، انتشار آگهی و استفاده از امکانات اصلی سایت کاملاً رایگان است. فقط برای برخی امکانات ویژه هزینه دریافت می‌شود.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                چگونه می‌توانم آگهی خود را ویرایش کنم؟
              </h3>
              <p className="text-gray-600">
                در پنل کاربری خود، بخش "آگهی‌های من" را باز کرده و روی آگهی مورد نظر کلیک کنید تا بتوانید آن را ویرایش کنید.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;

