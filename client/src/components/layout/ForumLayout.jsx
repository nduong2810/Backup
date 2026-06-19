import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';

import Header from './Header';
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';
import Footer from './Footer';
import { usePostFilters } from '../../hook/usePostFilters';

export default function ForumLayout() {
    const location = useLocation();
    const isAdminPage = location.pathname.startsWith('/admin');

    const {
        filters,
        searchInput,
        handleSearchChange,
        handleFilterChange,
        handleSearch,
        handleApplyFilters,
        handleClearFilters,
    } = usePostFilters();

    return (
        <div className="bg-background text-on-background font-body-md text-body-md antialiased min-h-screen flex flex-col">
            <Header
                searchValue={searchInput}
                onSearchChange={handleSearchChange}
                onSearch={handleSearch}
            />
            <div className="w-full max-w-none mx-auto px-4 lg:px-6 flex flex-col lg:flex-row gap-stack-md pt-stack-lg flex-1">
                <LeftSidebar />

                <Outlet context={{
                    filters,
                    handleFilterChange,
                    handleApplyFilters,
                }} />

                {!isAdminPage && (
                    <RightSidebar
                        filters={filters}
                        onFilterChange={handleFilterChange}
                        onApply={handleApplyFilters}
                        onClear={handleClearFilters}
                    />
                )}
            </div>
            <Footer />
        </div>
    );
}