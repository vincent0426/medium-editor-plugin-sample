import Editor from '@/ui/editor';

export default function Home() {
  return (
    <div className="flex flex-col h-screen pt-40">
      <div className="flex px-4 justify-center items-center flex-grow">
        <Editor />
      </div>
    </div>
  );
}
