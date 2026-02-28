import { useState } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDataset } from '@/contexts/DatasetContext';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

function generateResponse(query: string, results: ReturnType<typeof useDataset>['analysisResults']): string {
  const q = query.toLowerCase();

  if (!results) {
    return "Please upload and analyze a dataset first. I can help explain bias findings once you've run an analysis.";
  }

  if (q.includes('score') || q.includes('fair')) {
    return `Your dataset has an overall fairness score of ${results.overallScore}/100, which indicates a **${results.riskLevel}** risk level. ${results.overallScore >= 75 ? 'This is generally acceptable, but always review individual metrics.' : 'Consider applying the recommended mitigations to improve fairness.'}`;
  }

  if (q.includes('bias') || q.includes('biased')) {
    const col = results.mostBiasedColumn;
    return `The most biased column detected is **"${col}"**. ${results.proxyBiasDetected ? `Additionally, proxy bias was detected — some non-sensitive columns are highly correlated with sensitive attributes, which can introduce indirect discrimination.` : 'No proxy bias was detected in this dataset.'}`;
  }

  if (q.includes('fix') || q.includes('recommend') || q.includes('what should')) {
    const top = results.recommendations[0];
    return top
      ? `My top recommendation: **${top.title}**. ${top.description} This has a **${top.impact}** expected impact on fairness.`
      : 'Your dataset appears fair. Keep monitoring as data evolves.';
  }

  if (q.includes('safe') || q.includes('hiring') || q.includes('use')) {
    if (results.overallScore >= 75) {
      return `Based on the analysis, this dataset shows low bias risk (score: ${results.overallScore}/100). However, always combine automated analysis with domain expert review before using in high-stakes decisions like hiring.`;
    }
    return `This dataset shows **${results.riskLevel}** bias risk (score: ${results.overallScore}/100). I would recommend addressing the identified biases before using it for sensitive applications. Review the mitigation recommendations for actionable steps.`;
  }

  if (q.includes('proxy')) {
    if (results.proxyBiases.length === 0) return 'No proxy biases were detected in this dataset.';
    return results.proxyBiases.map((pb) => `**${pb.column}** may act as a proxy for **${pb.sensitiveColumn}** (correlation: ${pb.correlation.toFixed(2)}). ${pb.explanation}`).join('\n\n');
  }

  if (q.includes('underrepresented') || q.includes('representation')) {
    const ug = results.mostUnderrepresentedGroup;
    return ug.column
      ? `The most underrepresented group is **"${ug.group}"** in column **"${ug.column}"** at ${(ug.percentage * 100).toFixed(1)}% representation.`
      : 'No significant underrepresentation was detected.';
  }

  return `I can help you understand your bias analysis results. Try asking:\n• "What is the fairness score?"\n• "Why is this dataset biased?"\n• "What should I fix first?"\n• "Is this dataset safe for hiring?"\n• "Tell me about proxy bias"`;
}

export function ChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hi! I'm your ethical AI assistant. Ask me anything about your dataset's bias analysis." },
  ]);
  const [input, setInput] = useState('');
  const { analysisResults } = useDataset();

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: Message = { role: 'user', content: input };
    const response = generateResponse(input, analysisResults);
    setMessages((prev) => [...prev, userMsg, { role: 'assistant', content: response }]);
    setInput('');
  };

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full gradient-bg flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
      >
        {isOpen ? <X className="h-6 w-6 text-primary-foreground" /> : <MessageCircle className="h-6 w-6 text-primary-foreground" />}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 h-[500px] bg-card rounded-2xl shadow-2xl border border-border flex flex-col animate-scale-in overflow-hidden">
          <div className="gradient-bg px-5 py-4">
            <h3 className="text-primary-foreground font-semibold">AI Ethics Assistant</h3>
            <p className="text-primary-foreground/70 text-xs">Context-aware bias explanations</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                    msg.role === 'user'
                      ? 'gradient-bg text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground'
                  }`}
                >
                  {msg.content.split('\n').map((line, j) => (
                    <p key={j} className={j > 0 ? 'mt-1' : ''}>
                      {line.split('**').map((part, k) =>
                        k % 2 === 1 ? <strong key={k}>{part}</strong> : part
                      )}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 border-t border-border">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask about bias findings..."
                className="flex-1 bg-secondary rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground"
              />
              <Button onClick={handleSend} size="icon" variant="gradient" className="rounded-full shrink-0">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
