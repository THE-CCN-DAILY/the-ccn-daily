import React from 'react';

const ReaderFooter: React.FC = () => {
    const footerStyle: React.CSSProperties = {
        color: `rgb(var(--reader-text-secondary))`,
        borderTopColor: `rgb(var(--reader-border))`
    };
    return (
        <div style={footerStyle} className="flex-shrink-0 text-center text-sm p-2 border-t">
            Page 1 of 2 &middot; Chapter 1 of 3
        </div>
    );
};

export default ReaderFooter;