import React from 'react';
import { Outlet } from 'react-router-dom';

import Header from './Header';
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';
import Footer from './Footer';

export default function ForumLayout() {
    return (
        <div className="bg-background text-on-background font-body-md text-body-md antialiased min-h-screen flex flex-col">
            <Header />
            <div className="max-w-container-max mx-auto px-gutter w-full flex flex-col lg:flex-row gap-stack-lg pt-stack-lg flex-1">
                <LeftSidebar />

                <Outlet />

                <RightSidebar />
            </div>
            <Footer />
        </div>
    );
}