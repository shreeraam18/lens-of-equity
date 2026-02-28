import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Shield, BarChart3, Eye, Lightbulb, ArrowRight, CheckCircle, Zap, FileText } from 'lucide-react';

const features = [
  {
    icon: Eye,
    title: 'Bias Detection',
    description: 'Automatically scan datasets for demographic, representation, and proxy bias with advanced statistical analysis.',
  },
  {
    icon: BarChart3,
    title: 'Visual Analytics',
    description: 'Interactive charts, heatmaps, and distribution visualizations that make bias patterns immediately visible.',
  },
  {
    icon: Lightbulb,
    title: 'Smart Mitigation',
    description: 'AI-powered recommendations with one-click simulation to see fairness improvements before applying changes.',
  },
  {
    icon: FileText,
    title: 'Audit Reports',
    description: 'Generate compliance-ready audit reports with comprehensive bias findings and mitigation documentation.',
  },
];

const steps = [
  { num: '01', title: 'Upload Dataset', description: 'Drag & drop your CSV file. We auto-detect sensitive columns and data types.' },
  { num: '02', title: 'Analyze Bias', description: 'Run comprehensive fairness analysis with real statistical metrics and correlation detection.' },
  { num: '03', title: 'Mitigate & Report', description: 'Apply recommended fixes, simulate improvements, and generate audit-ready reports.' },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-foreground">BiasLens</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">How it Works</a>
            <a href="#about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">About</a>
          </div>
          <Button variant="hero" onClick={() => navigate('/upload')}>
            Analyze Dataset <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 gradient-bg-subtle" />
        <div className="absolute top-20 right-0 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-accent/5 blur-3xl" />

        <div className="max-w-5xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-8 animate-fade-in">
            <Shield className="h-4 w-4" />
            AI-Powered Fairness Analysis
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 animate-slide-up">
            Detect & Eliminate
            <br />
            <span className="gradient-text">Dataset Bias</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            BiasLens analyzes your datasets for hidden biases, provides actionable mitigation strategies, and generates compliance-ready audit reports — all in your browser.
          </p>

          <div className="flex items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <Button variant="hero" size="xl" onClick={() => navigate('/upload')}>
              Analyze Dataset <ArrowRight className="h-5 w-5" />
            </Button>
            <Button variant="heroOutline" size="xl" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
              Learn More
            </Button>
          </div>

          <div className="flex items-center justify-center gap-6 mt-10 text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: '0.6s' }}>
            <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-success" /> No data leaves your browser</span>
            <span className="flex items-center gap-1.5"><Zap className="h-4 w-4 text-warning" /> Real-time analysis</span>
            <span className="flex items-center gap-1.5"><Shield className="h-4 w-4 text-primary" /> Enterprise-grade</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Comprehensive Bias Analysis</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              From detection to mitigation, BiasLens provides everything you need to ensure fair and ethical AI.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <div
                key={feature.title}
                className="group bg-card rounded-2xl border border-border p-6 hover:shadow-lg hover:border-primary/20 transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="h-12 w-12 rounded-xl gradient-bg-subtle flex items-center justify-center mb-4 group-hover:shadow-glow transition-all duration-300">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-24 px-6 gradient-bg-subtle">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">How BiasLens Works</h2>
            <p className="text-muted-foreground text-lg">Three simple steps to a fairer dataset.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div key={step.num} className="relative animate-fade-in" style={{ animationDelay: `${i * 0.15}s` }}>
                <span className="text-6xl font-extrabold gradient-text opacity-30">{step.num}</span>
                <h3 className="text-xl font-bold text-foreground mt-2 mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="about" className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Build Ethical AI, Today
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            Join organizations committed to fairness. Start analyzing your datasets with BiasLens — completely free, completely private.
          </p>
          <Button variant="hero" size="xl" onClick={() => navigate('/upload')}>
            Get Started <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">BiasLens</span>
          </div>
          <p className="text-sm text-muted-foreground">Ethical AI starts with fair data.</p>
        </div>
      </footer>
    </div>
  );
}
