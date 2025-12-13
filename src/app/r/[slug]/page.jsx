
import RoomClient from './RoomClient';

export const metadata = {
    title: 'Telepathy Room',
};

export default function RoomPage({ params }) {
    return <RoomClient slug={params.slug} />;
}
