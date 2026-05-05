import HostDetail from './HostDetail';

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  // We use a static placeholder param 'view'
  const staticParams = Promise.resolve({ id: 'view' });
  return <HostDetail params={staticParams} />;
}
