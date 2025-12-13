import RoomClient from './RoomClient';

export const metadata = {
  title: 'Telepathy Room',
};

export default async function RoomPage({ params }) {
  const { slug } = await params;
  return <RoomClient slug={slug} />;
}
