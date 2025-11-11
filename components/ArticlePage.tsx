import React, { useState, useEffect } from 'react';
import { BlogPost } from '../types';
import api from '../services/apiService';
import Logo from './Logo';

interface Props {
  slug: string;
  onNavigate: (path: string) => void;
}

const ArticlePage: React.FC<Props> = ({ slug, onNavigate }) => {
  const [post, setPost] = useState<BlogPost | null>(null);

  useEffect(() => {
    const foundPost = api.getBlogPostBySlug(slug);
    setPost(foundPost || null);
  }, [slug]);

  if (!post) {
    return (
        <div className="text-center py-20">
            <h1 className="text-2xl font-bold">Article not found</h1>
            <button onClick={() => onNavigate('/blog')} className="mt-4 text-blue-600 hover:underline">Back to Resources</button>
        </div>
    );
  }

  // A simple markdown-to-html renderer
  const renderContent = (content: string) => {
    const lines = content.trim().split('\n');
    return lines.map((line, index) => {
        if (line.startsWith('**') && line.endsWith('**')) {
            return <h3 key={index} className="text-xl font-bold text-gray-800 mt-6 mb-2">{line.slice(2, -2)}</h3>;
        }
        if (line.startsWith('*   ')) {
            return <li key={index} className="ml-6 list-disc">{line.slice(4)}</li>;
        }
         if (line === '---') {
            return <hr key={index} className="my-6" />;
        }
        return <p key={index} className="my-4">{line}</p>;
    });
  };

  return (
    <div className="bg-white min-h-screen">
       <header className="bg-white/80 backdrop-blur-md sticky top-0 z-40">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center cursor-pointer" onClick={() => onNavigate('/')}>
                <Logo className="h-12 w-auto" />
            </div>
             <button onClick={() => onNavigate('/blog')} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700">Back to Resources</button>
          </div>
        </nav>
      </header>

      <main className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <article className="prose lg:prose-xl">
            <h1 className="text-4xl font-extrabold text-gray-900" style={{fontFamily: 'Montserrat, sans-serif'}}>{post.title}</h1>
            <p className="text-md text-gray-500">By {post.author} on {post.date}</p>
            <div className="mt-4 flex flex-wrap gap-2">
                {post.tags.map(tag => (
                    <span key={tag} className="bg-gray-200 text-gray-800 text-xs font-semibold px-2 py-1 rounded-full">{tag}</span>
                ))}
            </div>

            <div className="mt-8 text-lg text-gray-700 leading-relaxed">
                {renderContent(post.content)}
            </div>
        </article>
      </main>

       <footer className="bg-gray-800 text-white mt-16">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 text-center text-sm">
            <p>&copy; {new Date().getFullYear()} Inspector's Academy. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default ArticlePage;
