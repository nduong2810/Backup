import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import FilterSidebar from '../common/FilterSidebar';
import { fetchTagsThunk } from '../../store/slices/tagSlice';

const DEFAULT_TAG_COLLECTION = {
    items: [],
    loading: false,
    error: null,
    pagination: { total: 0, page: 1, limit: 0, totalPages: 0 },
};

const RightSidebar = ({ filters, onFilterChange, onApply, onClear }) => {
    const dispatch = useDispatch();
    const tagCollection = useSelector((state) => state.tags?.collections?.sidebarTags || DEFAULT_TAG_COLLECTION);
    const tags = tagCollection.items || [];
    const loadingTags = tagCollection.loading;

    useEffect(() => {
        if (!tags.length && !loadingTags) {
            dispatch(fetchTagsThunk({ key: 'sidebarTags', params: { limit: 8, page: 1 } }));
        }
    }, [dispatch, loadingTags, tags.length]);

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
                    <h2 className="font-headline-md text-[16px] font-bold text-on-surface">Lọc câu hỏi</h2>
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
                    <h2 className="font-headline-md text-[16px] font-bold text-on-surface">Tags</h2>
                </div>
                <div className="p-4 flex flex-col gap-3">
                    {loadingTags && (
                        <p className="font-body-sm text-body-sm text-secondary">Đang tải tags...</p>
                    )}
                    {!loadingTags && tags.length === 0 && (
                        <p className="font-body-sm text-body-sm text-secondary">Chưa có tags.</p>
                    )}
                    {tags.map((item) => {
                        const tagLabel = item.name || item.slug;
                        return (
                        <div key={item.slug} className="flex items-center justify-between">
                            <Link
                                to={`/home?tags=${encodeURIComponent(item.slug)}`}
                                className="font-label-mono text-label-mono bg-secondary-fixed text-[#39739d] px-2 py-1 rounded-DEFAULT hover:bg-secondary-fixed/80"
                                title={`Lọc bài viết theo tag: ${tagLabel}`}
                            >
                                {tagLabel}
                            </Link>
                            <span className="font-body-sm text-body-sm text-secondary">x {item.totalCount}</span>
                        </div>
                    )})}
                </div>
            </div>
        </aside>
    );
};

export default RightSidebar;