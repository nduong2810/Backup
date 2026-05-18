import React from 'react';

const Footer = () => {
    return (
        <footer className="bg-inverse-surface text-inverse-on-surface py-stack-lg border-t border-outline-variant mt-auto">
            <div className="max-w-container-max mx-auto px-gutter flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[32px] opacity-80">code</span>
                    <span className="font-headline-md text-body-md font-bold text-surface-dim">DevStack Forum</span>
                </div>
                <div className="flex gap-4 font-body-sm text-body-sm text-outline">
                    <a className="hover:text-inverse-on-surface transition-colors" href="#">About Us</a>
                    <a className="hover:text-inverse-on-surface transition-colors" href="#">Terms of Service</a>
                    <a className="hover:text-inverse-on-surface transition-colors" href="#">Privacy Policy</a>
                </div>
                <div className="font-body-sm text-body-sm text-outline">
                    © 2026 DevStack Inc. All rights reserved.
                </div>
            </div>
        </footer>
    );
};

export default Footer;