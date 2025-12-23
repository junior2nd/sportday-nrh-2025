import React from "react";

type ParticipantsCardProps = {
    value: string;
    className?: string;
    textSize?: string; // e.g., 'text-5xl/16', 'text-3xl/16', 'text-2xl/16'
    isSpinning?: boolean;
};

export default function ParticipantsCard({ value, className, textSize = 'text-5xl/16', isSpinning = false }: ParticipantsCardProps) {
    return (
            <div className={`grid items-center bg-linear-to-r from-zinc-800 to-zinc-800/70 text-white  rounded-xl ${textSize} shadow-lg shadow-green-500/50 border-2 border-green-400/70 ${className || ''}`}>
                <p className={isSpinning ? 'animate-spin' : ''}>
                {value}
                </p>
            </div>
        // </div>
    );
}

