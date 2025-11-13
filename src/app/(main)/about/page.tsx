'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ChevronRightIcon,
  HeartIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  GlobeAltIcon,
  SparklesIcon,
  CheckCircleIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';

const AboutPage: React.FC = () => {
  const features = [
    {
      icon: <ShieldCheckIcon className="h-8 w-8" />,
      title: "Security & Trust",
      description: "All ads are reviewed and verified to ensure a safe and reliable experience"
    },
    {
      icon: <UserGroupIcon className="h-8 w-8" />,
      title: "Large Community",
      description: "Thousands of active users posting new ads every day"
    },
    {
      icon: <GlobeAltIcon className="h-8 w-8" />,
      title: "Nationwide Coverage",
      description: "Our services are available in all Canadian cities"
    },
    {
      icon: <SparklesIcon className="h-8 w-8" />,
      title: "Simple Interface",
      description: "Simple and user-friendly design that makes using the platform easy"
    }
  ];

  const stats = [
    { number: "10,000+", label: "Active Users" },
    { number: "50,000+", label: "Published Ads" },
    { number: "15+", label: "Different Categories" },
    { number: "99%", label: "User Satisfaction" }
  ];

  const team = [
    {
      name: "تیم توسعه",
      role: "طراحی و توسعه پلتفرم",
      description: "متخصصان با تجربه در زمینه توسعه وب و طراحی رابط کاربری"
    },
    {
      name: "تیم پشتیبانی",
      role: "پشتیبانی کاربران",
      description: "تیم متخصص در حل مشکلات کاربران و ارائه راهنمایی"
    },
    {
      name: "تیم امنیت",
      role: "امنیت و اعتبارسنجی",
      description: "متخصصان امنیت سایبری و اعتبارسنجی آگهی‌ها"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              درباره تیمچه
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
              پلتفرم پیشرو در خرید و فروش آنلاین با تمرکز بر امنیت، اعتماد و تجربه کاربری عالی
            </p>
            <div className="flex justify-center">
              <Link
                href="/register"
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                شروع کنید
                <ChevronRightIcon className="inline-block w-5 h-5 ml-2" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              چرا تیمچه؟
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              ما با ارائه بهترین تجربه کاربری و امنیت بالا، خرید و فروش آنلاین را برای شما آسان کرده‌ایم
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center p-6 rounded-lg hover:shadow-lg transition-shadow">
                <div className="text-blue-600 mb-4 flex justify-center">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-20 bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              آمار و ارقام
            </h2>
            <p className="text-xl text-gray-600">
              رشد مداوم و رضایت کاربران ما
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-blue-600 mb-2">
                  {stat.number}
                </div>
                <div className="text-lg text-gray-600">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              تیم ما
            </h2>
            <p className="text-xl text-gray-600">
              متخصصان با تجربه که در خدمت شما هستند
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <div key={index} className="text-center p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <UserGroupIcon className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {member.name}
                </h3>
                <p className="text-blue-600 font-medium mb-2">
                  {member.role}
                </p>
                <p className="text-gray-600">
                  {member.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            آماده شروع هستید؟
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            همین حالا به خانواده بزرگ تیمچه بپیوندید و از بهترین تجربه خرید و فروش آنلاین لذت ببرید
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              ثبت نام کنید
            </Link>
            <Link
              href="/contact"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
            >
              تماس با ما
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;

