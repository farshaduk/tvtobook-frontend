'use client';

import React, { useState } from 'react';
import { FileText, Loader2, RefreshCw, Plus, Edit, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { noteApi, NoteDto, CreateNoteRequest, UpdateNoteRequest } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToastHelpers } from '@/hooks/useToastHelpers';
import { toPersianNumber } from '@/utils/numberUtils';

const NotesPage: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingNote, setEditingNote] = useState<NoteDto | null>(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [notePageNumber, setNotePageNumber] = useState(1);
  const [noteChapter, setNoteChapter] = useState('');
  const [noteHighlightedText, setNoteHighlightedText] = useState('');
  const [noteHighlightColor, setNoteHighlightColor] = useState('#fff3cd');
  const [noteIsPrivate, setNoteIsPrivate] = useState(true);
  const { user } = useAuth();
  const toast = useToastHelpers();
  const queryClient = useQueryClient();

  const { data: notesResponse, isLoading, error, refetch } = useQuery({
    queryKey: ['my-notes', user?.id],
    queryFn: async () => {
      const response = await noteApi.getMyNotes();
      return response.data;
    },
    enabled: !!user?.id && typeof window !== 'undefined',
  });

  const notes: NoteDto[] = notesResponse?.data || [];

  const createNoteMutation = useMutation({
    mutationFn: (data: CreateNoteRequest) => noteApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-notes'] });
      toast.successPersian('یادداشت با موفقیت ایجاد شد');
      setShowCreateModal(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.errorPersian(error.response?.data?.message || 'خطا در ایجاد یادداشت');
    },
  });

  const updateNoteMutation = useMutation({
    mutationFn: (data: UpdateNoteRequest) => noteApi.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-notes'] });
      toast.successPersian('یادداشت با موفقیت بروزرسانی شد');
      setEditingNote(null);
      resetForm();
    },
    onError: (error: any) => {
      toast.errorPersian(error.response?.data?.message || 'خطا در بروزرسانی یادداشت');
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: (id: string) => noteApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-notes'] });
      toast.successPersian('یادداشت با موفقیت حذف شد');
    },
    onError: (error: any) => {
      toast.errorPersian(error.response?.data?.message || 'خطا در حذف یادداشت');
    },
  });

  const resetForm = () => {
    setNoteTitle('');
    setNoteContent('');
    setNotePageNumber(1);
    setNoteChapter('');
    setNoteHighlightedText('');
    setNoteHighlightColor('#fff3cd');
    setNoteIsPrivate(true);
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const handleOpenEditModal = (note: NoteDto) => {
    setEditingNote(note);
    setNoteTitle(note.title);
    setNoteContent(note.content);
    setNotePageNumber(note.pageNumber);
    setNoteChapter(note.chapter || '');
    setNoteHighlightedText(note.highlightedText || '');
    setNoteHighlightColor(note.highlightColor || '#fff3cd');
    setNoteIsPrivate(note.isPrivate);
  };

  const handleCreateNote = () => {
    if (!noteTitle.trim()) {
      toast.errorPersian('عنوان یادداشت الزامی است');
      return;
    }
    if (!noteContent.trim()) {
      toast.errorPersian('محتوای یادداشت الزامی است');
      return;
    }

    const noteData: CreateNoteRequest = {
      productId: '', // This should be set from context or passed as prop
      title: noteTitle,
      content: noteContent,
      pageNumber: notePageNumber,
      chapter: noteChapter || undefined,
      highlightedText: noteHighlightedText || undefined,
      highlightColor: noteHighlightColor || undefined,
      isPrivate: noteIsPrivate,
    };

    createNoteMutation.mutate(noteData);
  };

  const handleUpdateNote = () => {
    if (!editingNote) return;
    if (!noteTitle.trim()) {
      toast.errorPersian('عنوان یادداشت الزامی است');
      return;
    }
    if (!noteContent.trim()) {
      toast.errorPersian('محتوای یادداشت الزامی است');
      return;
    }

    const noteData: UpdateNoteRequest = {
      id: editingNote.id,
      title: noteTitle,
      content: noteContent,
      highlightColor: noteHighlightColor || undefined,
      isPrivate: noteIsPrivate,
    };

    updateNoteMutation.mutate(noteData);
  };

  const handleDelete = (id: string) => {
    if (confirm('آیا از حذف این یادداشت اطمینان دارید؟')) {
      deleteNoteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">خطا در بارگذاری یادداشت‌ها</p>
        <Button onClick={() => refetch()} className="mt-4">
          <RefreshCw className="h-4 w-4 mr-1" />
          تلاش مجدد
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="relative backdrop-blur-sm bg-white/40 border border-white/50 rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-2xl">
        <div className="relative overflow-hidden rounded-xl lg:rounded-2xl p-4 sm:p-6 lg:p-8 mb-6 lg:mb-10 bg-gradient-to-r from-blue-600 via-indigo-600 via-purple-600 to-pink-600 shadow-2xl">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative z-10">
            <h1 className="text-2xl sm:text-3xl lg:text-5xl font-extrabold text-white mb-2 lg:mb-3 drop-shadow-2xl text-right">یادداشت‌های من</h1>
            <p className="text-blue-100 text-sm sm:text-base lg:text-xl font-medium text-right">📝 مدیریت یادداشت‌های مطالعه 📄</p>
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="flex justify-end mb-4">
            <Button onClick={handleOpenCreateModal} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              افزودن یادداشت
            </Button>
          </div>
          {notes.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <FileText className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">شما هنوز یادداشتی ثبت نکرده‌اید</p>
              <p className="text-sm text-gray-400 mt-2">یادداشت‌های شما در اینجا نمایش داده می‌شوند</p>
              <Button onClick={handleOpenCreateModal} className="mt-4" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                افزودن یادداشت
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {notes.map((note) => (
                <Card key={note.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">{note.title}</h3>
                        <p className="text-sm text-gray-600 line-clamp-3">{note.content}</p>
                      </div>
                      {note.isPrivate && (
                        <Badge className="bg-gray-100 text-gray-800 text-xs">خصوصی</Badge>
                      )}
                    </div>
                    {note.highlightedText && (
                      <div className="mt-2 p-2 rounded" style={{ backgroundColor: note.highlightColor || '#fff3cd' }}>
                        <p className="text-xs text-gray-700 italic">"{note.highlightedText}"</p>
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
                      <span>صفحه: {toPersianNumber(note.pageNumber)}</span>
                      {note.chapter && <span>• فصل: {note.chapter}</span>}
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenEditModal(note)}
                        className="flex-1"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        ویرایش
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(note.id)}
                        className="flex-1 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        حذف
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Note Modal */}
      {(showCreateModal || editingNote) && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm cursor-pointer"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              e.preventDefault();
              e.stopPropagation();
              setShowCreateModal(false);
              setEditingNote(null);
              resetForm();
            }
          }}
          onTouchEnd={(e) => {
            if (e.target === e.currentTarget) {
              e.preventDefault();
              e.stopPropagation();
              setShowCreateModal(false);
              setEditingNote(null);
              resetForm();
            }
          }}
          style={{ 
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent'
          }}
          aria-label="بستن مودال یادداشت"
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto"
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {editingNote ? 'ویرایش یادداشت' : 'افزودن یادداشت'}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowCreateModal(false);
                  setEditingNote(null);
                  resetForm();
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowCreateModal(false);
                  setEditingNote(null);
                  resetForm();
                }}
                className="touch-manipulation active:scale-90"
                style={{ 
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent'
                }}
                type="button"
                aria-label="بستن"
              >
                <X className="h-4 w-4 pointer-events-none" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="note-title">عنوان *</Label>
                <Input
                  id="note-title"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="عنوان یادداشت"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="note-content">محتوای یادداشت *</Label>
                <Textarea
                  id="note-content"
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="محتوای یادداشت"
                  className="mt-1"
                  rows={5}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="note-page">شماره صفحه</Label>
                  <Input
                    id="note-page"
                    type="number"
                    min="1"
                    value={notePageNumber}
                    onChange={(e) => setNotePageNumber(parseInt(e.target.value) || 1)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="note-chapter">فصل</Label>
                  <Input
                    id="note-chapter"
                    value={noteChapter}
                    onChange={(e) => setNoteChapter(e.target.value)}
                    placeholder="فصل (اختیاری)"
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="note-highlighted-text">متن برجسته شده</Label>
                <Input
                  id="note-highlighted-text"
                  value={noteHighlightedText}
                  onChange={(e) => setNoteHighlightedText(e.target.value)}
                  placeholder="متن برجسته شده (اختیاری)"
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="note-highlight-color">رنگ برجسته</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="note-highlight-color"
                      type="color"
                      value={noteHighlightColor}
                      onChange={(e) => setNoteHighlightColor(e.target.value)}
                      className="w-20 h-10"
                    />
                    <Input
                      type="text"
                      value={noteHighlightColor}
                      onChange={(e) => setNoteHighlightColor(e.target.value)}
                      placeholder="#fff3cd"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="note-private">خصوصی</Label>
                  <div className="mt-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={noteIsPrivate}
                        onChange={(e) => setNoteIsPrivate(e.target.checked)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-gray-700">یادداشت خصوصی</span>
                    </label>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={editingNote ? handleUpdateNote : handleCreateNote}
                  disabled={createNoteMutation.isPending || updateNoteMutation.isPending}
                  className="flex-1"
                >
                  {(createNoteMutation.isPending || updateNoteMutation.isPending) ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      در حال ذخیره...
                    </>
                  ) : (
                    editingNote ? 'بروزرسانی یادداشت' : 'ایجاد یادداشت'
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingNote(null);
                    resetForm();
                  }}
                  className="flex-1"
                >
                  انصراف
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotesPage;

