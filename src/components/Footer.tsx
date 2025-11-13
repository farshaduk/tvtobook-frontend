import Link from 'next/link';
import { BookOpen, Mail, Phone, MapPin, Facebook, Twitter, Instagram } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-muted/50 border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <BookOpen className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold">TvtoBook</span>
            </div>
            <p className="text-sm text-muted-foreground">
              مقصد نهایی شما برای کتاب‌ها، کتاب‌های الکترونیکی و کتاب‌های صوتی.
              کتاب بعدی مورد علاقه خود را با ما کشف کنید.
            </p>
            <div className="flex space-x-4 rtl:space-x-reverse">
              <Facebook className="h-5 w-5 text-muted-foreground hover:text-primary cursor-pointer transition-colors" />
              <Twitter className="h-5 w-5 text-muted-foreground hover:text-primary cursor-pointer transition-colors" />
              <Instagram className="h-5 w-5 text-muted-foreground hover:text-primary cursor-pointer transition-colors" />
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">لینک‌های سریع</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/shop" className="text-muted-foreground hover:text-primary transition-colors">
                  همه کتاب‌ها
                </Link>
              </li>
              <li>
                <Link href="/shop?category=book" className="text-muted-foreground hover:text-primary transition-colors">
                  کتاب‌های فیزیکی
                </Link>
              </li>
              <li>
                <Link href="/shop?category=ebook" className="text-muted-foreground hover:text-primary transition-colors">
                  کتاب‌های الکترونیکی
                </Link>
              </li>
              <li>
                <Link href="/shop?category=audiobook" className="text-muted-foreground hover:text-primary transition-colors">
                  کتاب‌های صوتی
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">خدمات مشتری</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/help" className="text-muted-foreground hover:text-primary transition-colors">
                  مرکز راهنمایی
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="text-muted-foreground hover:text-primary transition-colors">
                  اطلاعات ارسال
                </Link>
              </li>
              <li>
                <Link href="/returns" className="text-muted-foreground hover:text-primary transition-colors">
                  بازگشت و تعویض
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-primary transition-colors">
                  تماس با ما
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">اطلاعات تماس</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <MapPin className="h-4 w-4" />
                <span>تهران، خیابان آزادی، نبش جهارراه خوش جنب درب ورودی سازمان آموزش فنی و حرفه ای کشور پلاک 246 شرکت تعاونی توزیعی خاص کارکنان ستاد مرکزی سازمان آموزش فنی و حرفه ای کشور</span>
              </div>
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Phone className="h-4 w-4" />
                <span>۰۲۱-۶۶۴۲۶۶۶۹</span>
              </div>
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Mail className="h-4 w-4" />
                <span>support@tvtoBook.com</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground">
            © ۱۴۰۳ TvtoBook. تمامی حقوق محفوظ است.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0 rtl:space-x-reverse">
            <Link href="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              حریم خصوصی
            </Link>
            <Link href="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              شرایط استفاده
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

