import React from 'react';

const RightSidebar = () => {
    return (
        <aside className="w-full lg:w-72 flex-shrink-0 flex flex-col gap-stack-lg pb-12">
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
                <div className="p-4 flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                        <label className="font-label-mono text-label-mono font-bold text-on-surface">Status</label>
                        <select className="w-full bg-surface-container-lowest border border-outline-variant rounded-DEFAULT px-3 py-2 font-body-sm text-body-sm focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none">
                            <option>All</option>
                            <option>Resolved</option>
                            <option>Unresolved</option>
                        </select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="font-label-mono text-label-mono font-bold text-on-surface">Tags</label>
                        <input className="w-full bg-surface-container-lowest border border-outline-variant rounded-DEFAULT px-3 py-2 font-body-sm text-body-sm focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none placeholder:text-outline" placeholder="Add tags..." type="text" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="font-label-mono text-label-mono font-bold text-on-surface">Sort By</label>
                        <select className="w-full bg-surface-container-lowest border border-outline-variant rounded-DEFAULT px-3 py-2 font-body-sm text-body-sm focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none">
                            <option>Newest</option>
                            <option>Relevance</option>
                            <option>Most Viewed</option>
                            <option>Most Upvoted</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                            <label className="font-label-mono text-label-mono font-bold text-on-surface">Min Views</label>
                            <input className="w-full bg-surface-container-lowest border border-outline-variant rounded-DEFAULT px-3 py-2 font-body-sm text-body-sm focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none" placeholder="0" type="number" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="font-label-mono text-label-mono font-bold text-on-surface">Min Upvotes</label>
                            <input className="w-full bg-surface-container-lowest border border-outline-variant rounded-DEFAULT px-3 py-2 font-body-sm text-body-sm focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none" placeholder="0" type="number" />
                        </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                        <button className="flex-1 bg-primary-container hover:bg-primary-container/90 text-on-primary font-body-sm text-body-sm font-semibold py-2 rounded-DEFAULT transition-colors">Apply Filters</button>
                        <button className="px-4 py-2 bg-surface-container-high hover:bg-surface-container-highest text-secondary font-body-sm text-body-sm font-semibold rounded-DEFAULT transition-colors">Clear</button>
                    </div>
                </div>
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