import EditUnitClient from './EditUnitClient';

export async function generateStaticParams() {
  return [{ id: 'edit' }];
}

export const dynamicParams = false;

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return <EditUnitClient params={params} />;
}
