import EditUnitClient from '@/app/dashboard/units/[id]/edit/EditUnitClient';

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  // Static placeholder for dashboard edit point
  const staticParams = Promise.resolve({ id: 'edit' });
  return <EditUnitClient params={staticParams} />;
}
