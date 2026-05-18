import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import LeftSidebar from './LeftSidebar';
import PostDetailRightSidebar from '../post/PostDetailRightSidebar';
import Footer from './Footer';

// ====================================================================
// PostDetailLayout — Layout cho trang chi tiết bài viết
// ====================================================================

export default function PostDetailLayout() {
    return (
        <div className="bg-background text-on-background font-body-md text-body-md antialiased min-h-screen flex flex-col">
            <Header />
            <div className="w-full max-w-none mx-auto px-4 lg:px-6 flex flex-col lg:flex-row gap-stack-md pt-stack-lg flex-1">
                <LeftSidebar />
                <Outlet />
                <PostDetailRightSidebar />
            </div>
            <Footer />
        </div>
    );
}
