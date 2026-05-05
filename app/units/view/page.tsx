import UnitDetail from './UnitDetail';

export default function Page() {
  const params = Promise.resolve({ id: 'view' });
  return <UnitDetail params={params} />;
}
