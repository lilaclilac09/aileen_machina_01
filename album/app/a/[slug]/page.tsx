import { AlbumClient } from "@/components/AlbumClient";

type Props = { params: { slug: string } };

export default function AlbumPage({ params }: Props) {
  return <AlbumClient slug={params.slug} />;
}
