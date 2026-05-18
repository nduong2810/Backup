import React from 'react';
import FilterSidebar from '../common/FilterSidebar';

const RightSidebar = ({ filters, onFilterChange, onApply, onClear }) => {
    return (
        <aside className="w-full lg:w-64 flex-shrink-0 flex flex-col gap-stack-lg pb-12">
            {/* Announcements Card */}
            <div className="bg-[#fdf7e2] border border-[#e6c172] rounded-DEFAULT overflow-hidden shadow-sm">
                <div className="bg-[#fbf3d5] border-b border-[#e6c172] px-4 py-2 font-headline-md text-[15px] font-bold text-[#4c3b12]">
                    Featured on Meta
                </div>
                <div className="p-4 flex flex-col gap-3">
                    <div className="flex gap-2">
                        <span className="material-symbols-outlined text-[#39739d] text-[18px] shrink-0">chat_bubble</span>
                        <a className="font-body-sm text-body-sm text-on-surface hover:text-primary-container transition-colors" href="#">Improving the new user onboarding experience: We need your feedback</a>
                    </div>
                    <div className="flex gap-2">
                        <span className="material-symbols-outlined text-[#39739d] text-[18px] shrink-0">campaign</span>
                        <a className="font-body-sm text-body-sm text-on-surface hover:text-primary-container transition-colors" href="#">Update to our API rate limits starting next month</a>
                    </div>
                </div>
            </div>

            {/* Filter Card */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-DEFAULT shadow-sm overflow-hidden">
                <div className="bg-surface-container-low border-b border-outline-variant px-4 py-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary text-[20px]">filter_alt</span>
                    <h2 className="font-headline-md text-[16px] font-bold text-on-surface">Filter Questions</h2>
                </div>
                <FilterSidebar
                    filters={filters}
                    onFilterChange={onFilterChange}
                    onApply={onApply}
                    onClear={onClear}
                    embed
                />
            </div>

            {/* Popular Tags Card */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-DEFAULT shadow-sm overflow-hidden">
                <div className="bg-surface-container-low border-b border-outline-variant px-4 py-3">
                    <h2 className="font-headline-md text-[16px] font-bold text-on-surface">Popular Tags</h2>
                </div>
                <div className="p-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <span className="font-label-mono text-label-mono bg-secondary-fixed text-[#39739d] px-2 py-1 rounded-DEFAULT hover:bg-secondary-fixed/80 cursor-pointer">react</span>
                        <span className="font-body-sm text-body-sm text-secondary">x 10k</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="font-label-mono text-label-mono bg-secondary-fixed text-[#39739d] px-2 py-1 rounded-DEFAULT hover:bg-secondary-fixed/80 cursor-pointer">python</span>
                        <span className="font-body-sm text-body-sm text-secondary">x 8k</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="font-label-mono text-label-mono bg-secondary-fixed text-[#39739d] px-2 py-1 rounded-DEFAULT hover:bg-secondary-fixed/80 cursor-pointer">nodejs</span>
                        <span className="font-body-sm text-body-sm text-secondary">x 5k</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="font-label-mono text-label-mono bg-secondary-fixed text-[#39739d] px-2 py-1 rounded-DEFAULT hover:bg-secondary-fixed/80 cursor-pointer">ai</span>
                        <span className="font-body-sm text-body-sm text-secondary">x 2k</span>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default RightSidebar;