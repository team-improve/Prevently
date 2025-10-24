import ImageViewer from "@/components/ImageViewer";

export default function ViewPage({ params }: { params: { id: string } }) {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      <h1 className="text-2xl font-bold mb-6">View Image: {params.id}</h1>
      <ImageViewer id={params.id} />
    </main>
  );
}
