import { GlobeAltIcon } from '@heroicons/react/24/outline';
import { lusitana } from '@/app/ui/fonts';
import Image from 'next/image';
export default function OurLogo() {
  return (
    <div
      className={`${lusitana.className} flex flex-row items-center leading-none text-white`}
    >
      <Image
      
        src="/finance_mode_90dp_FFFFFF.png"
        className="h-12 w-12"
        width={500}
        height={500}
        alt=":D"
      />
      <p className="text-[44px]">Predictly</p>
    </div>
  );
}
