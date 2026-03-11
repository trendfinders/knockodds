'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { AuthModal } from '@/components/auth/AuthModal';
import type { Comment } from '@/lib/supabase/types';

interface CommentSectionProps {
  pageType: 'prediction' | 'news';
  pageSlug: string;
  strings: {
    commentsTitle: string;
    writeComment: string;
    loginToComment: string;
    submit: string;
    delete: string;
    noComments: string;
    placeholder: string;
    signIn: string;
    signUp: string;
    email: string;
    password: string;
    displayName: string;
    signInWithGoogle: string;
    or: string;
    noAccount: string;
    hasAccount: string;
    close: string;
  };
}

export function CommentSection({ pageType, pageSlug, strings }: CommentSectionProps) {
  const { user, loading: authLoading } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/comments?page_type=${pageType}&page_slug=${encodeURIComponent(pageSlug)}`);
      const data = await res.json();
      if (data.comments) setComments(data.comments);
    } catch {}
  }, [pageType, pageSlug]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !user) return;
    setLoading(true);

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page_type: pageType, page_slug: pageSlug, content }),
      });
      if (res.ok) {
        setContent('');
        await fetchComments();
      }
    } catch {}
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/comments?id=${id}`, { method: 'DELETE' });
      await fetchComments();
    } catch {}
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <section className="mt-10 pt-8 border-t border-gray-200">
      <h2 className="text-2xl font-heading font-bold mb-6">{strings.commentsTitle}</h2>

      {/* Comment form */}
      {authLoading ? (
        <div className="card p-4 mb-6 animate-pulse bg-surface-muted h-20" />
      ) : user ? (
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-primary text-sm font-bold">
                {(user.user_metadata?.display_name || user.email)?.[0]?.toUpperCase() || 'U'}
              </div>
              <span className="text-sm text-gray-500">
                {user.user_metadata?.display_name || user.email?.split('@')[0]}
              </span>
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={strings.placeholder}
              rows={3}
              maxLength={2000}
              className="w-full bg-surface-alt border border-gray-200 rounded px-4 py-2.5 text-sm text-dark focus:border-primary focus:outline-none resize-none"
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-400">{content.length}/2000</span>
              <button
                type="submit"
                disabled={loading || !content.trim()}
                className="bg-primary hover:bg-primary-dark text-white text-sm font-bold py-2 px-5 rounded transition-colors disabled:opacity-50"
              >
                {loading ? '...' : strings.submit}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="card p-5 mb-6 text-center">
          <p className="text-gray-500 mb-3">{strings.loginToComment}</p>
          <button
            onClick={() => setShowAuth(true)}
            className="bg-primary hover:bg-primary-dark text-white text-sm font-bold py-2 px-6 rounded transition-colors"
          >
            {strings.signIn}
          </button>
        </div>
      )}

      {/* Comments list */}
      {comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="card p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-surface-muted flex items-center justify-center text-gray-500 text-xs font-bold">
                    {comment.user_name[0]?.toUpperCase() || 'U'}
                  </div>
                  <span className="text-sm font-medium text-dark">{comment.user_name}</span>
                  <span className="text-xs text-gray-400">{formatDate(comment.created_at)}</span>
                </div>
                {user?.id === comment.user_id && (
                  <button
                    onClick={() => handleDelete(comment.id)}
                    className="text-xs text-gray-400 hover:text-red-600 transition-colors"
                  >
                    {strings.delete}
                  </button>
                )}
              </div>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{comment.content}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-400 text-sm">{strings.noComments}</p>
      )}

      {/* Auth modal */}
      <AuthModal
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        strings={strings}
      />
    </section>
  );
}
