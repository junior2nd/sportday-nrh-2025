'use client';

interface EmptyCardProps {
  text?: string;
  borderColor?: string;
  className?: string;
}

export default function EmptyCard({ 
  text = 'Empty', 
  borderColor = 'border-zinc-800/35',
  className 
}: EmptyCardProps) {
  return (
    <div className={`flex flex-col justify-center items-center bg-white/20 border-2 ${borderColor} rounded-lg shadow-xl ${className || ''} overflow-hidden`}>
      <div className="flex justify-center">
        <img
          src="/images/Logonrh.png"
          alt="NR Sport Logo"
          className="w-[100px] opacity-10"
        />
      </div>
      {/* <p className='text-zinc-200/55 tracking-[1em] text-center pl-6'>{text}</p> */}
    </div>
  );
}

