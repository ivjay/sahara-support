"use client";

export function TypingIndicator() {
    return (
        <div className="flex gap-3 mb-4">
            <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs shrink-0">
                S
            </div>
            <div className="px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 dark:bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-gray-400 dark:bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-gray-400 dark:bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
            </div>
        </div>
    );
}