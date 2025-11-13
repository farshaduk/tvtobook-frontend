'use client';

import React from 'react';
import Link from 'next/link';
import { 
  RocketLaunchIcon,
  ChevronRightIcon,
  DocumentTextIcon,
  PhotoIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  TagIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

const HelpPage: React.FC = () => {
  const steps = [
    {
      icon: <DocumentTextIcon className="h-8 w-8" />,
      title: "Create Account",
      description: "First, register on the site or sign in to your account. This step is essential for identity verification and ad security."
    },
    {
      icon: <TagIcon className="h-8 w-8" />,
      title: "Select Category",
      description: "Choose the appropriate category for your ad. This helps buyers find your ad more easily."
    },
    {
      icon: <DocumentTextIcon className="h-8 w-8" />,
      title: "Complete Information",
      description: "Enter an attractive title, complete description, and technical specifications of your product or service accurately."
    },
    {
      icon: <PhotoIcon className="h-8 w-8" />,
      title: "Add Images",
      description: "Upload high-quality and clear images of your product. Good images have a significant impact on attracting buyers."
    },
    {
      icon: <CurrencyDollarIcon className="h-8 w-8" />,
      title: "Set Price",
      description: "Set a reasonable and competitive price for your product or service. You can also declare the price as negotiable."
    },
    {
      icon: <MapPinIcon className="h-8 w-8" />,
      title: "Add Location",
      description: "Enter the exact location of your product or service. This information helps buyers find you more easily."
    }
  ];

  const tips = [
    {
      icon: <CheckCircleIcon className="h-6 w-6 text-green-500" />,
      title: "Use Clear Photos",
      description: "Take photos in good lighting and from different angles to show your product clearly."
    },
    {
      icon: <CheckCircleIcon className="h-6 w-6 text-green-500" />,
      title: "Write Detailed Descriptions",
      description: "Provide complete information about your product including condition, age, and any defects."
    },
    {
      icon: <CheckCircleIcon className="h-6 w-6 text-green-500" />,
      title: "Set Competitive Prices",
      description: "Research similar products to set a fair and competitive price."
    },
    {
      icon: <CheckCircleIcon className="h-6 w-6 text-green-500" />,
      title: "Respond Quickly",
      description: "Reply to messages and inquiries as quickly as possible to maintain buyer interest."
    }
  ];

  const warnings = [
    {
      icon: <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500" />,
      title: "Avoid Scams",
      description: "Never send money before seeing the product and always meet in safe, public places."
    },
    {
      icon: <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500" />,
      title: "Verify Identity",
      description: "Ask for identification and verify the seller's identity before making large purchases."
    },
    {
      icon: <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500" />,
      title: "Check Product Condition",
      description: "Always inspect the product thoroughly before finalizing the purchase."
    }
  ];

  const faqs = [
    {
      question: "How do I create an account?",
      answer: "Click on the 'Register' button in the top right corner, fill in your information, and verify your email address."
    },
    {
      question: "How do I post an ad?",
      answer: "After logging in, click on 'Post Ad' button, select a category, fill in the required information, upload photos, and publish your ad."
    },
    {
      question: "How do I edit my ad?",
      answer: "Go to 'My Ads' section in your profile, find the ad you want to edit, and click on the edit button."
    },
    {
      question: "How do I delete my ad?",
      answer: "In the 'My Ads' section, find your ad and click on the delete button. This action cannot be undone."
    },
    {
      question: "How do I contact a seller?",
      answer: "Click on the 'Contact Seller' button on the ad page to send a message to the seller."
    },
    {
      question: "Is posting ads free?",
      answer: "Yes, posting basic ads is completely free. Premium features may require payment."
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              راهنمای استفاده
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
              راهنمای کامل برای استفاده از پلتفرم تیمچه و انتشار آگهی
            </p>
            <div className="flex justify-center">
              <Link
                href="/register"
                className="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                شروع کنید
                <ChevronRightIcon className="inline-block w-5 h-5 ml-2" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Steps Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              مراحل انتشار آگهی
            </h2>
            <p className="text-xl text-gray-600">
              با این مراحل ساده، آگهی خود را منتشر کنید
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="text-center p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="text-purple-600 mb-4 flex justify-center">
                  {step.icon}
                </div>
                <div className="text-sm font-semibold text-purple-600 mb-2">
                  مرحله {index + 1}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-600">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tips Section */}
      <div className="py-20 bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              نکات مهم
            </h2>
            <p className="text-xl text-gray-600">
              نکاتی برای موفقیت در فروش
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {tips.map((tip, index) => (
              <div key={index} className="flex items-start space-x-4 p-6 bg-white rounded-lg shadow-sm">
                <div className="flex-shrink-0">
                  {tip.icon}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {tip.title}
                  </h3>
                  <p className="text-gray-600">
                    {tip.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Warnings Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              هشدارهای امنیتی
            </h2>
            <p className="text-xl text-gray-600">
              نکات مهم برای حفظ امنیت شما
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {warnings.map((warning, index) => (
              <div key={index} className="text-center p-6 rounded-lg border border-yellow-200 bg-yellow-50">
                <div className="flex justify-center mb-4">
                  {warning.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {warning.title}
                </h3>
                <p className="text-gray-600">
                  {warning.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="py-20 bg-gray-100">
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
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {faq.question}
                </h3>
                <p className="text-gray-600">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            هنوز سوالی دارید؟
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            اگر پاسخ سوال خود را پیدا نکردید، با ما تماس بگیرید
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="bg-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
            >
              تماس با ما
            </Link>
            <Link
              href="/register"
              className="border-2 border-purple-600 text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-purple-600 hover:text-white transition-colors"
            >
              ثبت نام کنید
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpPage;

