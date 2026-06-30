import ButtonExamples from "@/components/ui/examples/ButtonExamples";
import LoaderExamples from "@/components/ui/examples/LoaderExamples";

export default function LoaderPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br mt-20 from-slate-50 to-slate-100">
      <LoaderExamples />
      <div><ButtonExamples/></div>
    </div>
    
  );
}