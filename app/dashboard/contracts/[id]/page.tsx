import ContractClient from './ContractClient';

export async function generateStaticParams() {
  return [{ id: 'view' }];
}

export const dynamicParams = false;

export default function Page() {
  return <ContractClient />;
}
