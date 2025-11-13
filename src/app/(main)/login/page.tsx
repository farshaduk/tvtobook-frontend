'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Mail, Lock, User, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Spinner, TvtoBookSpinner } from '@/components/ui/spinner'
import { useLoading } from '@/providers/LoadingProvider'
import { useAuth } from '@/contexts/AuthContext'
import { authApi } from '@/services/api'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [sessions, setSessions] = useState<any[]>([])
  const [loggingOutSessions, setLoggingOutSessions] = useState<Set<string>>(new Set())
  const router = useRouter()
  const { login, isAuthenticated, isLoading } = useAuth()
  const { startLoading, stopLoading } = useLoading()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  // Redirect authenticated users
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/profile')
    }
  }, [isAuthenticated, router])

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <TvtoBookSpinner />
      </div>
    )
  }

  const handleLogoutSession = async (sessionId: string) => {
    if (!sessionId) return;
    
    setLoggingOutSessions(prev => new Set(prev).add(sessionId))
    
    try {
      await authApi.logoutOthers(sessionId)
      
      // Remove the logged out session from sessions state
      setSessions(prev => {
        const updated = prev.filter((s: any) => {
          const sId = s.sessionId || s.Id;
          return String(sId) !== String(sessionId);
        });
        
        if (updated.length === 0) {
          setError('')
        } else {
          const sessionInfoJson = JSON.stringify(updated);
          const updatedError = error.replace(/اطلاعات جلسات فعال:\s*(\[[\s\S]*\])/, `اطلاعات جلسات فعال: ${sessionInfoJson}`);
          setError(updatedError);
        }
        
        return updated;
      })
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 
                          error?.response?.data?.error || 
                          error?.message || 
                          'خطا در خروج از جلسه'
      setError(errorMessage)
    } finally {
      setLoggingOutSessions(prev => {
        const newSet = new Set(prev)
        newSet.delete(sessionId)
        return newSet
      })
    }
  }

  const onSubmit = async (data: LoginFormData) => {
      startLoading('در حال ورود...', true)
    setError('')

    try {
      await login(data.email, data.password)
      
      // ✅ Refresh token is now stored in HttpOnly cookie by backend
      
      // Redirect immediately after login
      router.push('/profile')
      stopLoading()
    } catch (error: any) {
      // Extract backend error message
      let errorMessage = error?.response?.data?.message || 
                        error?.response?.data?.error || 
                        error?.message || 
                        'خطایی رخ داد. لطفاً دوباره تلاش کنید.'
      
      // Extract session data from error message
      // Backend format: "اطلاعات جلسات فعال: {sessionInfoJson}"
      const sessionInfoIndex = errorMessage.indexOf('اطلاعات جلسات فعال:');
      if (sessionInfoIndex !== -1) {
        const sessionInfoJson = errorMessage.substring(sessionInfoIndex + 'اطلاعات جلسات فعال:'.length).trim();
        try {
          const sessionData = JSON.parse(sessionInfoJson);
          if (Array.isArray(sessionData)) {
            setSessions(sessionData);
          } else {
            setSessions([]);
          }
        } catch (e) {
          setSessions([]);
        }
      } else {
        setSessions([]);
      }
      
      setError(errorMessage)
      stopLoading()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <BookOpen className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-2xl">خوش آمدید</CardTitle>
            <CardDescription>
              برای ادامه وارد حساب کاربری خود شوید
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="p-4 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20 mb-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    {error.includes('حداکثر تعداد جلسات فعال') ? (
                      <div className="w-5 h-5 rounded-full bg-destructive/20 flex items-center justify-center">
                        <svg className="w-3 h-3 text-destructive" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-destructive/20 flex items-center justify-center">
                        <svg className="w-3 h-3 text-destructive" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium mb-1">
                      {error.includes('حداکثر تعداد جلسات فعال') ? 'جلسات فعال بیش از حد مجاز' : 'خطا در ورود'}
                    </div>
                    <div className="text-xs leading-relaxed">
                      {error.includes('حداکثر تعداد جلسات فعال') ? (
                        <>
                          شما به حداکثر تعداد جلسات فعال رسیده‌اید. لطفاً ابتدا از یکی از دستگاه‌های خود خارج شوید.
                          <br />
                          <br />
                          <div className="bg-destructive/5 p-3 rounded border border-destructive/10">
                            <div className="font-medium text-destructive/90 mb-2">جلسات فعال فعلی:</div>
                            {sessions.length > 0 ? (
                              sessions.map((session: any, index: number) => {
                                const sessionId = session.sessionId || session.Id;
                                const isLoggingOut = sessionId && loggingOutSessions.has(String(sessionId));
                                return (
                                  <div key={sessionId || index} className="flex items-center justify-between py-2 text-xs border-b border-destructive/10 last:border-b-0">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full bg-destructive/60"></div>
                                      <span className="text-gray-700">
                                        {session.DeviceType || 'نامشخص'} - {session.IpAddress || 'نامشخص'}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-gray-500">
                                        #{index + 1}
                                      </span>
                                      <button
                                        type="button"
                                        className="h-7 px-3 text-xs border border-destructive rounded-md bg-white hover:bg-destructive/10 hover:border-destructive text-destructive disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors font-medium relative z-10"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          if (sessionId && !isLoggingOut) {
                                            handleLogoutSession(String(sessionId));
                                          }
                                        }}
                                        disabled={!sessionId || isLoggingOut}
                                      >
                                        {isLoggingOut ? (
                                          <Spinner className="h-3 w-3" />
                                        ) : (
                                          'خروج'
                                        )}
                                      </button>
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              <div className="text-gray-600">اطلاعات جلسات در دسترس نیست</div>
                            )}
                          </div>
                          <br />
                          <span className="text-destructive/80 font-medium">راه حل:</span> از منوی کاربری در سایر دستگاه‌ها، گزینه "خروج" را انتخاب کنید.
                        </>
                      ) : (
                        error
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <div>
                <label className="text-sm font-medium mb-2 block">ایمیل</label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground rtl:right-3 ltr:left-3" />
                  <Input
                    {...register('email')}
                    type="email"
                    placeholder="ایمیل خود را وارد کنید"
                    className={`pr-10 pl-4 rtl:pr-10 rtl:pl-4 ltr:pl-10 ltr:pr-4 ${errors.email ? 'border-destructive' : ''}`}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">رمز عبور</label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground rtl:right-3 ltr:left-3" />
                  <Input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="رمز عبور خود را وارد کنید"
                    className={`pr-10 pl-10 rtl:pr-10 rtl:pl-10 ltr:pl-10 ltr:pr-10 ${errors.password ? 'border-destructive' : ''}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute left-0 top-0 h-full px-3 hover:bg-transparent rtl:left-0 ltr:right-0"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2 cursor-pointer rtl:space-x-reverse">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm text-muted-foreground">مرا به خاطر بسپار</span>
                </label>
                <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                  رمز عبور را فراموش کرده‌اید؟
                </Link>
              </div>

              <Button type="submit" className="w-full">
                ورود
              </Button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    یا با ادامه دهید
                  </span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <Button variant="outline" className="w-full">
                  <svg className="h-4 w-4 ml-2 rtl:ml-2 rtl:mr-0" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  گوگل
                </Button>
                <Button variant="outline" className="w-full">
                  <svg className="h-4 w-4 ml-2 rtl:ml-2 rtl:mr-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.746-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001.012.001z"/>
                  </svg>
                  اپل
                </Button>
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                حساب کاربری ندارید؟{' '}
                <Link href="/register" className="text-primary hover:underline">
                  ثبت نام کنید
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

