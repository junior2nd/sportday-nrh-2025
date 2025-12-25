'use client';

interface EmptyCardProps {
  text?: string;
  borderColor?: string;
  className?: string;
}

export default function EmptyCard({ 
  text = 'Empty', 
  borderColor = 'border-gray-200/20',
  className 
}: EmptyCardProps) {
  return (
    <div className={`relative w-full h-full rounded-xl border-2 ${borderColor} overflow-hidden ${className || ''}`} style={{ perspective: '1000px' }}>
      {/* Container matching SlotMachineCard structure */}
      <div className="absolute inset-0 w-full h-full">
        {/* Background matching SlotMachineCard front face */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-gray-800/30 via-gray-700/20 to-gray-600/30 flex items-center justify-center"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'translateZ(0px)',
          }}
        >
          <div className="flex justify-center items-center">
            <img
              src="/images/Logonrh.png"
              alt="NR Sport Logo"
              className="w-[100px] opacity-10"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

