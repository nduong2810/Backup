import React from 'react';

const LeftSidebar = () => {
    return (
        <aside className="w-full lg:w-64 flex-shrink-0">
            <nav className="sticky top-[calc(4rem+1.5rem)] flex flex-col py-stack-lg gap-stack-sm bg-surface dark:bg-background border-r border-outline-variant dark:border-outline h-[calc(100vh-4rem-1.5rem)] hidden lg:flex">
                <div className="px-4 pb-2">
                    <h2 className="font-label-mono text-label-mono text-outline font-bold tracking-wider mb-1">PUBLIC</h2>
                    <p className="font-body-sm text-body-sm text-secondary">Community Forum</p>
                </div>
                <div className="flex flex-col gap-1">
                    <a className="bg-surface-container-high text-primary font-bold border-r-4 border-primary py-2 px-4 flex items-center gap-2 hover:bg-surface-container transition-colors" href="#">
                        <span className="material-symbols-outlined text-[18px]">home</span>
                        <span>Home</span>
                    </a>
                    <a className="text-secondary py-2 px-4 flex items-center gap-2 hover:bg-surface-container transition-colors" href="#">
                        <span className="material-symbols-outlined text-[18px]">help</span>
                        <span>Questions</span>
                    </a>
                    <a className="text-secondary py-2 px-4 flex items-center gap-2 hover:bg-surface-container transition-colors" href="#">
                        <span className="material-symbols-outlined text-[18px]">sell</span>
                        <span>Tags</span>
                    </a>
                    <a className="text-secondary py-2 px-4 flex items-center gap-2 hover:bg-surface-container transition-colors" href="#">
                        <span className="material-symbols-outlined text-[18px]">group</span>
                        <span>Users</span>
                    </a>
                </div>
                <div className="mt-8 px-4 pb-2">
                    <h2 className="font-label-mono text-label-mono text-outline font-bold tracking-wider mb-1">TEAMS</h2>
                </div>
                <div className="flex flex-col gap-1">
                    <a className="text-secondary py-2 px-4 flex items-center gap-2 hover:bg-surface-container transition-colors" href="#">
                        <span className="material-symbols-outlined text-[18px]">work</span>
                        <span>Teams</span>
                    </a>
                    <a className="text-secondary py-2 px-4 flex items-center gap-2 hover:bg-surface-container transition-colors" href="#">
                        <span className="material-symbols-outlined text-[18px]">group_work</span>
                        <span>Collectives</span>
                    </a>
                </div>
            </nav>
        </aside>
    );
};

export default LeftSidebar;