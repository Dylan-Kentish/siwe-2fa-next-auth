import { NextPage } from 'next';

import { getServerSession } from '@/app/api/auth/options';
import { TwoFA } from '@/components/session/2fa';
import { Info } from '@/components/session/info';

const Page: NextPage = async () => {
  return (
    <div className="flex w-[70vw] gap-10">
      <Info />
      <TwoFA />
    </div>
  );
};

export default Page;
