import { NextPage } from 'next';

import { getServerSession } from '@/app/api/auth/options';
import { Info } from '@/components/session/info';

const Page: NextPage = async () => {
  const session = await getServerSession();

  return <Info session={session!} />;
};

export default Page;
