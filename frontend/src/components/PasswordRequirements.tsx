import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { Info } from 'lucide-react';

export type PasswordRequirementCheck = {
    label: string;
    isMet: boolean;
};

const POPOVER_MAX_WIDTH = 360;

const PasswordRequirements = ({ checks }: { checks: PasswordRequirementCheck[] }) => {
    const triggerRef = useRef<HTMLButtonElement | null>(null);
    const popoverRef = useRef<HTMLDivElement | null>(null);
    const [visible, setVisible] = useState(false);
    const [style, setStyle] = useState<{ left: number; top: number } | null>(null);

    useEffect(() => {
        const onDocClick = (e: MouseEvent) => {
            if (triggerRef.current && triggerRef.current.contains(e.target as Node)) return;
            if (popoverRef.current && popoverRef.current.contains(e.target as Node)) return;
            setVisible(false);
        };
        const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setVisible(false); };
        document.addEventListener('mousedown', onDocClick);
        document.addEventListener('keydown', onEsc);
        return () => {
            document.removeEventListener('mousedown', onDocClick);
            document.removeEventListener('keydown', onEsc);
        };
    }, []);

    useEffect(() => {
        if (!visible) return;
        const position = () => {
            const trigger = triggerRef.current;
            const pop = popoverRef.current;
            if (!trigger || !pop) return;

            const rect = trigger.getBoundingClientRect();
            // start with below placement
            let left = Math.max(8, rect.left);
            const desiredWidth = Math.min(POPOVER_MAX_WIDTH, window.innerWidth - 16);
            if (left + desiredWidth > window.innerWidth - 8) {
                left = Math.max(8, window.innerWidth - desiredWidth - 8);
            }

            // Temporarily set left to measure height
            pop.style.visibility = 'hidden';
            pop.style.left = `${left}px`;
            pop.style.top = `${rect.bottom + 8 + window.scrollY}px`;
            pop.style.width = `${desiredWidth}px`;

            // measure and decide whether to flip above
            const popRect = pop.getBoundingClientRect();
            const bottomSpace = window.innerHeight - rect.bottom;
            let top = rect.bottom + 8 + window.scrollY;
            if (bottomSpace < popRect.height + 12) {
                // flip above
                top = rect.top - popRect.height - 8 + window.scrollY;
                if (top < 8 + window.scrollY) { // still too high, clamp
                    top = 8 + window.scrollY;
                }
            }

            setStyle({ left, top });
            pop.style.visibility = '';
        };

        position();
        window.addEventListener('resize', position);
        window.addEventListener('scroll', position, true);
        return () => {
            window.removeEventListener('resize', position);
            window.removeEventListener('scroll', position, true);
        };
    }, [visible]);

    const popover = (
        <div
            ref={popoverRef}
            role="dialog"
            aria-label="Password requirements dialog"
            className={`rounded-lg bg-white border border-gray-200 shadow-md p-3 text-xs z-[9999]`}
            style={{
                position: 'absolute',
                left: style ? `${style.left}px` : '-9999px',
                top: style ? `${style.top}px` : '-9999px',
                width: POPOVER_MAX_WIDTH,
                maxWidth: '90vw'
            }}
            onMouseEnter={() => setVisible(true)}
            onMouseLeave={() => setVisible(false)}
        >
            <p className="text-xs font-semibold text-gray-700 mb-2">Password requirements:</p>
            <ul className="list-disc list-inside space-y-1">
                {checks.map((r) => (
                    <li key={r.label} className={r.isMet ? 'text-green-600' : 'text-red-500'}>
                        {r.label}
                    </li>
                ))}
            </ul>
        </div>
    );

    return (
        <>
            <button
                ref={triggerRef}
                type="button"
                aria-haspopup="dialog"
                aria-expanded={visible}
                aria-label="Password requirements"
                onClick={() => setVisible((v) => !v)}
                onMouseEnter={() => setVisible(true)}
                onFocus={() => setVisible(true)}
                onMouseLeave={() => setVisible(false)}
                className="flex items-center gap-2 text-sm text-gray-700"
            >
                <span className="text-xs font-semibold">Password requirements</span>
                <Info className="text-gray-500" />
            </button>

            {typeof document !== 'undefined' && visible ? ReactDOM.createPortal(popover, document.body) : null}
        </>
    );
};

export default PasswordRequirements;
