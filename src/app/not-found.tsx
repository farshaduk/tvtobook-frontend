'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Home, ArrowLeft, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      <div className="text-center max-w-md mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-6xl font-bold text-primary mb-4">404</div>
          <h1 className="text-2xl font-bold mb-4">صفحه یافت نشد</h1>
          <p className="text-muted-foreground mb-8">
            متأسفانه صفحه مورد نظر شما یافت نشد. ممکن است آدرس اشتباه باشد یا صفحه حذف شده باشد.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/">
              <Button size="lg">
                <Home className="h-4 w-4 ml-2 rtl:ml-2 rtl:mr-0" />
                بازگشت به خانه
              </Button>
            </Link>
            <Link href="/shop">
              <Button variant="outline" size="lg">
                <Search className="h-4 w-4 ml-2 rtl:ml-2 rtl:mr-0" />
                جستجو در فروشگاه
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

