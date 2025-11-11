import React, { useState, useEffect } from 'react';
import { BlogPost } from '../types';
import api from '../services/apiService';
import Logo from './Logo';

interface Props {
  onNavigateHome: () => void;
}

const BlogPage: React.FC<Props> = ({ onNavigateHome }) => {
  const [posts, setPosts] = useState<BlogPost[]>([]);

  useEffect(() => {
    const blogPosts = api.getBlogPosts();
    setPosts(blogPosts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  }, []);

  return (
    <div className="bg-gray-50 min-h-screen">
       <header className="bg-white/80 backdrop-blur-md sticky top-0 z-40">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center cursor-pointer" onClick={onNavigateHome}>
                <Logo className="h-12 w-auto" />
            </div>
             <button onClick={onNavigateHome} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700">Back to Main Site</button>
          </div>
        </nav>
      </header>

      <main className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
            <h1 className="text-4xl font-extrabold text-gray-900" style={{fontFamily: 'Montserrat, sans-serif'}}>Inspector's Academy Resources</h1>
            <p className="mt-4 text-lg text-gray-600">Expert insights and study guides to help you pass your certification exams.</p>
        </div>
        
        <div className="space-y-8">
            {posts.map(post => (
                <a key={post.slug} href={`/blog/${post.slug}`} className="block bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow">
                    <h2 className="text-2xl font-bold text-blue-700 hover:underline">{post.title}</h2>
                    <p className="text-sm text-gray-500 mt-2">By {post.author} on {post.date}</p>
                    <p className="text-gray-700 mt-4">{post.excerpt}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                        {post.tags.map(tag => (
                            <span key={tag} className="bg-gray-200 text-gray-800 text-xs font-semibold px-2 py-1 rounded-full">{tag}</span>
                        ))}
                    </div>
                </a>
            ))}
        </div>
      </main>

       <footer className="bg-gray-800 text-white mt-16">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 text-center text-sm">
            <p>&copy; {new Date().getFullYear()} Inspector's Academy. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default BlogPage;